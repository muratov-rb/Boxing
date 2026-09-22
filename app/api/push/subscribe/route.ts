import { NextResponse } from "next/server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/user";
import { pushConfigured } from "@/lib/push-server";
import { isPushServiceEndpoint } from "@/lib/push-endpoints";
import { MAX_SLOTS, SLOT_LABEL_MAX, parseHhMm, type ReminderSlot } from "@/lib/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Where a device registers itself for reminders that arrive with the app shut.

   The push_subscriptions table is service-role only — `authenticated` has no
   grant on it whatsoever — so this route is the only door, and everything
   below the session check is about not letting anything through it that the
   dispatcher would later choke on. The dispatcher runs unattended once a
   minute; a malformed row there is a silent outage, not a 500 someone sees. */

/** One device's worth of rows. Re-subscribing returns the same endpoint and
    updates in place, so this only bites someone genuinely using many devices,
    and it bounds what one account can make the dispatcher do. */
const MAX_DEVICES = 12;

function cleanSlots(raw: unknown): ReminderSlot[] {
  if (!Array.isArray(raw)) return [];
  const out: ReminderSlot[] = [];
  for (const item of raw.slice(0, MAX_SLOTS)) {
    if (typeof item !== "object" || item === null) continue;
    const slot = item as Partial<ReminderSlot>;
    if (typeof slot.id !== "string" || typeof slot.time !== "string") continue;
    /* A time the parser rejects would make the slot silently never fire.
       Dropping it here at least keeps the rest of the schedule working. */
    if (parseHhMm(slot.time) === null) continue;
    out.push({
      id: slot.id.slice(0, 40),
      label: typeof slot.label === "string" ? slot.label.slice(0, SLOT_LABEL_MAX) : "",
      time: slot.time,
      kind: slot.kind === "training" ? "training" : "meal",
    });
  }
  return out;
}

function cleanWater(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null) return { enabled: false };
  const w = raw as Record<string, unknown>;
  const from = typeof w.from === "string" && parseHhMm(w.from) !== null ? w.from : "08:00";
  const to = typeof w.to === "string" && parseHhMm(w.to) !== null ? w.to : "22:00";
  const every = Number(w.everyMinutes);
  return {
    enabled: w.enabled === true,
    everyMinutes: Number.isFinite(every) ? Math.min(360, Math.max(15, Math.round(every))) : 120,
    from,
    to,
  };
}

/** An IANA zone name, checked by asking the runtime to use it. A bad value
    here would throw inside the dispatcher's loop and take out everybody
    else's reminders in the same run, so it never gets stored. */
function cleanTz(raw: unknown): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 64) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: raw });
    return raw;
  } catch {
    return "UTC";
  }
}

function cleanMealMinutes(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((n) => Number(n))
    .filter((n) => Number.isInteger(n) && n >= 0 && n < 1440)
    .slice(0, 24);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!serviceRoleConfigured() || !pushConfigured()) {
    return NextResponse.json({ error: "push_unavailable" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const sub = body.subscription as
    | { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
    | undefined;
  const endpoint = typeof sub?.endpoint === "string" ? sub.endpoint : "";
  const p256dh = typeof sub?.keys?.p256dh === "string" ? sub.keys.p256dh : "";
  const auth = typeof sub?.keys?.auth === "string" ? sub.keys.auth : "";

  /* Only a real browser push service. The endpoint is a URL this server will
     later send requests to on a schedule and on demand, so it is not somewhere
     to accept whatever arrives. This used to check for "https://" and a sane
     length -- which the 2026-09-22 audit exploited by registering a "device"
     at an arbitrary page and watching the dispatcher post to it. The comment
     here named the risk ("that is the shape of an SSRF") while the check
     beneath it did not prevent it. */
  if (!isPushServiceEndpoint(endpoint) || !p256dh || !auth) {
    return NextResponse.json({ error: "bad_subscription" }, { status: 400 });
  }

  const db = createAdminClient();

  /* Count the OTHER devices: an update to one that already exists must not be
     refused for being the thirteenth of twelve. */
  const { count } = await db
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("endpoint", endpoint);
  if ((count ?? 0) >= MAX_DEVICES) {
    return NextResponse.json({ error: "too_many_devices" }, { status: 409 });
  }

  const row = {
    user_id: user.id,
    endpoint,
    p256dh,
    auth,
    tz: cleanTz(body.tz),
    locale: body.locale === "ru" || body.locale === "es" || body.locale === "fr" || body.locale === "zh"
      ? (body.locale as string)
      : "en",
    enabled: body.enabled !== false,
    slots: cleanSlots(body.slots),
    water: cleanWater(body.water),
    meal_minutes: cleanMealMinutes(body.mealMinutes),
    updated_at: new Date().toISOString(),
  };

  /* Conflict on endpoint, not on id: the same device re-subscribing must
     replace its schedule, not add a second row that fires alongside the
     first. user_id is taken from the session and never from the body, so one
     account cannot write a schedule onto another's device. */
  const { error } = await db
    .from("push_subscriptions")
    .upsert(row, { onConflict: "endpoint" })
    .select("id");

  if (error) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** Turning reminders off, or revoking permission, removes the device. */
export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "push_unavailable" }, { status: 503 });
  }

  const endpoint = new URL(req.url).searchParams.get("endpoint") ?? "";
  if (!endpoint.startsWith("https://")) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  /* Scoped to the caller as well as the endpoint, so knowing somebody else's
     endpoint is not enough to switch their reminders off. */
  const { error } = await createAdminClient()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
