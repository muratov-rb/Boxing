import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { sendPush, pushConfigured, type PushPayload } from "@/lib/push-server";
import { dueReminders, markFired, type ReminderSettings, type ReminderSlot } from "@/lib/reminders";
import en from "@/messages/en.json";
import ru from "@/messages/ru.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import zh from "@/messages/zh.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===========================================================================
   The thing that makes a reminder arrive with the app closed.

   Called once a minute by pg_cron inside Supabase (see
   db/migrations/004_reminder_cron.sql). Vercel's own cron was the obvious
   choice and is not an option: the Hobby plan will not run a job every
   minute. Postgres will, for nothing, and it is already paid for.

   WATER IS DELIBERATELY NOT PUSHED. A water nudge is only worth sending if
   you have not drunk enough, and how much you have drunk lives on the device.
   Pushing it blind would mean telling someone to drink right after they did,
   which is the nagging the whole feature was designed to avoid. Water
   reminders keep working in the app, where the number is known.
   =========================================================================== */

/** A bound on one run, so a pathological number of rows cannot run the
    function past its timeout and take every reminder down with it. */
const MAX_ROWS = 1000;

/* The push wording is read from the same catalogues the app uses rather than
   copied into this file. Copies drift, and the drift would only ever show up
   on a device that is asleep, where nobody is looking. These never reach the
   browser — this route is server-only. */
const CATALOGUE: Record<string, { remind: Record<string, string> }> = {
  en: en as never,
  ru: ru as never,
  es: es as never,
  fr: fr as never,
  zh: zh as never,
};

function copy(locale: string): Record<string, string> {
  const chosen = CATALOGUE[locale] ?? CATALOGUE.en;
  /* Fall back key-by-key, not whole-catalogue: a language that has not
     translated one string should still get the other four in its own words. */
  return { ...CATALOGUE.en.remind, ...chosen.remind };
}

/** Substitute {at} without a regex — this file has no business containing an
    escape, and the codebase has been bitten by one before. */
function fill(template: string, at: string): string {
  return template.split("{at}").join(at);
}

interface Row {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  tz: string;
  locale: string;
  slots: ReminderSlot[] | null;
  meal_minutes: number[] | null;
  last_fired: Record<string, string> | null;
  failures: number;
}

/**
 * What time it is on the device, from its IANA zone.
 *
 * An offset in minutes would have been simpler and wrong: one saved in
 * January is an hour out in July anywhere with daylight saving, and the
 * reminder would quietly drift rather than break.
 */
function deviceNow(tz: string): { minutes: number; today: string } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
  } catch {
    parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    today: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  /* Compare in constant time, and only when the lengths already match —
     timingSafeEqual throws on a length mismatch rather than returning false. */
  if (given.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

async function dispatch(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  if (!serviceRoleConfigured() || !pushConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, tz, locale, slots, meal_minutes, last_fired, failures")
    .eq("enabled", true)
    .limit(MAX_ROWS);

  if (error) return NextResponse.json({ error: "read_failed" }, { status: 500 });

  const rows = (data ?? []) as Row[];
  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (const row of rows) {
    const slots = Array.isArray(row.slots) ? row.slots : [];
    if (slots.length === 0) continue;

    const local = deviceNow(row.tz);
    const settings: ReminderSettings = {
      enabled: true,
      slots,
      /* Off here on purpose — see the note at the top of this file. */
      water: { enabled: false, everyMinutes: 120, from: "08:00", to: "22:00" },
      sound: true,
      vibrate: true,
      lastFired: row.last_fired ?? {},
    };

    const due = dueReminders({
      now: new Date(),
      nowMinutes: local.minutes,
      today: local.today,
      settings,
      loggedMealMinutes: Array.isArray(row.meal_minutes) ? row.meal_minutes : [],
      waterMl: 0,
      waterTargetMl: 0,
    });
    if (due.length === 0) continue;

    /* Record the send BEFORE making it.

       The cron fires every minute and a run can still be going when the next
       starts. Writing first makes this at-most-once: the cost is that a push
       lost to a transient network failure is not retried, and the benefit is
       that a slow run cannot deliver the same reminder twice. Being woken
       twice by the same notification is worse than missing one. */
    const next = markFired(
      settings,
      due.map((d) => d.key),
      local.today,
    );
    await db
      .from("push_subscriptions")
      .update({ last_fired: next.lastFired, updated_at: new Date().toISOString() })
      .eq("id", row.id);

    const words = copy(row.locale);
    let gone = false;

    for (const item of due) {
      const training = item.kind === "training";
      /* The slot's own name leads, which is the whole point of the request:
         the notification should say "Lunch", not "a reminder". */
      const named = item.label.trim().length > 0;
      const fallback = training ? words.trainingTitle : words.mealTitle;
      const payload: PushPayload = {
        title: named ? item.label : (fallback ?? "RingBornn"),
        body: fill(training ? words.trainingBody : words.mealBody, item.at),
        tag: item.key,
        url: "/calories",
        kind: item.kind === "water" ? "water" : item.kind,
        at: item.at,
        label: item.label,
      };

      const result = await sendPush(row, payload);
      if (result === "sent") sent++;
      else if (result === "gone") gone = true;
      else failed++;
    }

    if (gone) {
      /* The subscription is dead — uninstalled, permission revoked, browser
         data cleared. Retrying it every minute forever helps nobody. */
      await db.from("push_subscriptions").delete().eq("id", row.id);
      removed++;
    } else if (failed > 0) {
      await db
        .from("push_subscriptions")
        .update({ failures: (row.failures ?? 0) + 1 })
        .eq("id", row.id);
    } else if ((row.failures ?? 0) > 0) {
      await db.from("push_subscriptions").update({ failures: 0 }).eq("id", row.id);
    }
  }

  return NextResponse.json({ ok: true, devices: rows.length, sent, removed, failed });
}

/* pg_net posts; a person checking by hand will GET. Both are the same job. */
export const POST = dispatch;
export const GET = dispatch;
