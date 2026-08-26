"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import {
  hasSavedReminders,
  loadProfile,
  loadReminders,
  mealMinutesToday,
  saveReminders,
  todayKey,
  trainedToday,
  waterToday,
} from "@/lib/tracking";
import { waterTarget } from "@/lib/nutrients";
import {
  MAX_SLOTS,
  SLOT_LABEL_MAX,
  WATER_INTERVAL_CHOICES,
  dueReminders,
  markFired,
  newSlotId,
  type ReminderSettings,
  type ReminderSlot,
} from "@/lib/reminders";

/* Reminders to eat and drink.

   Two delivery paths on purpose. A system notification is the one people
   actually want, but it needs permission, only arrives while the app is open,
   and on iOS needs the site installed to the home screen first — so it can
   never be the only path. The in-app card underneath always works, and shows
   what is due the moment you open the page.

   Permission is requested from a button press and never on load: browsers
   demote sites that ask cold, and so do people. */

const CHECK_EVERY_MS = 60_000;

type Permission = "unsupported" | "default" | "granted" | "denied";

function readPermission(): Permission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as Permission;
}

export function ReminderCard() {
  const t = useTranslations("remind");
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [permission, setPermission] = useState<Permission>("default");
  const [dueNow, setDueNow] = useState<{ kind: string; at: string; label: string }[]>([]);
  /* Held in a ref as well as state: the interval closes over this and must see
     the latest settings without being torn down and rebuilt every keystroke. */
  const settingsRef = useRef<ReminderSettings | null>(null);

  useEffect(() => {
    let s = loadReminders();

    /* First run on this device: give the three starter slots names in the
       reader's language. Guarded on hasSavedReminders so a returning user's
       own names are never overwritten — including if they renamed one back to
       something that happens to match a default. */
    if (!hasSavedReminders()) {
      const names: Record<string, string> = {
        m1: t("slotBreakfast"),
        m2: t("slotLunch"),
        m3: t("slotDinner"),
      };
      s = { ...s, slots: s.slots.map((x) => ({ ...x, label: names[x.id] ?? x.label })) };
    }

    setSettings(s);
    settingsRef.current = s;
    setPermission(readPermission());
  }, [t]);

  const update = useCallback((next: ReminderSettings) => {
    settingsRef.current = next;
    setSettings(next);
    saveReminders(next);
  }, []);

  /* The scheduler. Runs while the page is open; that is the honest limit of
     what a web app can promise without a service worker. */
  useEffect(() => {
    const tick = () => {
      const s = settingsRef.current;
      if (!s?.enabled) {
        setDueNow([]);
        return;
      }
      const profile = loadProfile();
      const due = dueReminders({
        now: new Date(),
        today: todayKey(),
        settings: s,
        loggedMealMinutes: mealMinutesToday(),
        waterMl: waterToday(),
        waterTargetMl: waterTarget(profile, trainedToday()),
      });
      if (due.length === 0) return;

      setDueNow(due.map((d) => ({ kind: d.kind, at: d.at, label: d.label })));

      if (readPermission() === "granted") {
        for (const d of due) {
          try {
            /* The slot's own name leads, so a custom "Pre-workout shake"
               reminder says that rather than a generic "time to eat". */
            const named = d.kind === "meal" && d.label.trim().length > 0;
            new Notification(
              named ? d.label : d.kind === "meal" ? t("mealTitle") : t("waterTitle"),
              {
                body: d.kind === "meal" ? t("mealBody", { at: d.at }) : t("waterBody"),
                tag: d.key, // replaces rather than stacks if one is still on screen
              },
            );
          } catch {
            /* a blocked or throttled notification must not stop the in-app card */
          }
        }
      }

      /* Marked fired whether or not a system notification got through — the
         in-app card has shown it, and firing again would be nagging. */
      const next = markFired(s, due.map((d) => d.key), todayKey());
      settingsRef.current = next;
      setSettings(next);
      saveReminders(next);
    };

    tick();
    const id = setInterval(tick, CHECK_EVERY_MS);
    return () => clearInterval(id);
  }, [t]);

  const ask = async () => {
    if (!("Notification" in window)) return;
    try {
      setPermission((await Notification.requestPermission()) as Permission);
    } catch {
      setPermission(readPermission());
    }
  };

  if (!settings) return null;

  const setSlot = (id: string, patch: Partial<ReminderSlot>) =>
    update({
      ...settings,
      slots: settings.slots.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  /* Removing a slot drops its fired-key too. Otherwise deleting a slot and
     adding one back at the same hour would find the day already marked. */
  const removeSlot = (id: string) => {
    const lastFired = Object.fromEntries(
      Object.entries(settings.lastFired).filter(([k]) => !k.endsWith(`:${id}`)),
    );
    update({ ...settings, slots: settings.slots.filter((s) => s.id !== id), lastFired });
  };

  const addSlot = () =>
    update({
      ...settings,
      slots: [
        ...settings.slots,
        { id: newSlotId(), label: t("slotNewName"), time: "16:00" },
      ],
    });

  return (
    <section className="panel p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-blood">
            <Icon name="clock" size={18} />
          </span>
          <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
            {t("title")}
          </h2>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          onClick={() => update({ ...settings, enabled: !settings.enabled })}
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${
            settings.enabled ? "border-blood bg-blood/30" : "border-line bg-void"
          }`}
        >
          <span
            className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all ${
              settings.enabled ? "left-6 bg-blood" : "left-0.5 bg-ash-dim"
            }`}
          />
        </button>
      </div>
      <p className="text-xs leading-relaxed text-ash-dim">{t("sub")}</p>

      {settings.enabled && (
        <>
          {/* what is waiting right now */}
          {dueNow.length > 0 && (
            <ul className="mt-5 space-y-2">
              {dueNow.map((d, i) => (
                <li
                  key={`${d.kind}-${i}`}
                  className="flex items-center gap-2.5 rounded-xl border border-blood/40 bg-blood/10 px-3.5 py-2.5 text-sm text-bone"
                >
                  <span className="text-blood">
                    <Icon name={d.kind === "meal" ? "calorie" : "water"} size={15} />
                  </span>
                  {d.kind === "meal"
                    ? t("dueSlot", { name: d.label || t("slotNewName"), at: d.at })
                    : t("dueWater")}
                </li>
              ))}
            </ul>
          )}

          {/* the user's own slots — rename, re-time, remove, add */}
          <p className="mt-6 font-condensed text-xs uppercase tracking-widest text-ash">
            {t("slotsLabel")}
          </p>
          <ul className="mt-2.5 space-y-2">
            {settings.slots.map((slot) => (
              <li key={slot.id} className="flex items-center gap-2">
                <input
                  value={slot.label}
                  onChange={(e) => setSlot(slot.id, { label: e.target.value.slice(0, SLOT_LABEL_MAX) })}
                  placeholder={t("slotNamePlaceholder")}
                  maxLength={SLOT_LABEL_MAX}
                  aria-label={t("slotNameAria")}
                  className="min-h-[45px] min-w-0 flex-1 rounded-md border border-line bg-void px-3 py-2 text-base text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none"
                />
                <input
                  type="time"
                  value={slot.time}
                  onChange={(e) => setSlot(slot.id, { time: e.target.value })}
                  aria-label={t("slotTimeAria")}
                  className="min-h-[45px] w-[7.5rem] shrink-0 rounded-md border border-line bg-void px-2 py-2 text-base text-bone focus:border-blood focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeSlot(slot.id)}
                  disabled={settings.slots.length <= 1}
                  aria-label={t("slotRemove")}
                  title={t("slotRemove")}
                  className="grid h-[45px] w-[45px] shrink-0 place-items-center rounded-md border border-line text-ash-dim transition-colors hover:border-blood/50 hover:text-blood disabled:opacity-30"
                >
                  <Icon name="close" size={15} />
                </button>
              </li>
            ))}
          </ul>

          {settings.slots.length < MAX_SLOTS && (
            <button
              type="button"
              onClick={addSlot}
              className="btn btn-ghost mt-2.5 w-full !py-2.5 text-xs"
            >
              + {t("slotAdd")}
            </button>
          )}

          {/* water cadence */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="font-condensed text-xs uppercase tracking-widest text-ash">
              {t("waterLabel")}
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={settings.water.enabled}
              onClick={() =>
                update({
                  ...settings,
                  water: { ...settings.water, enabled: !settings.water.enabled },
                })
              }
              className={`font-condensed text-xs uppercase tracking-wider ${
                settings.water.enabled ? "text-blood" : "text-ash-dim"
              }`}
            >
              {settings.water.enabled ? t("on") : t("off")}
            </button>
          </div>

          {settings.water.enabled && (
            <>
              <div className="mt-2.5 grid grid-cols-4 gap-2">
                {WATER_INTERVAL_CHOICES.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() =>
                      update({ ...settings, water: { ...settings.water, everyMinutes: mins } })
                    }
                    className={`min-h-[45px] rounded-xl border px-2 font-condensed text-xs uppercase tracking-wider transition-colors ${
                      settings.water.everyMinutes === mins
                        ? "border-blood bg-blood/10 text-bone"
                        : "border-line text-ash hover:border-blood/50"
                    }`}
                  >
                    {mins < 120 ? t("everyMin", { n: mins }) : t("everyHour", { n: mins / 60 })}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="time"
                  value={settings.water.from}
                  onChange={(e) =>
                    update({ ...settings, water: { ...settings.water, from: e.target.value } })
                  }
                  aria-label={t("fromAria")}
                  className="min-h-[45px] flex-1 rounded-md border border-line bg-void px-3 py-2 text-base text-bone focus:border-blood focus:outline-none"
                />
                <span className="text-xs text-ash-dim">{t("to")}</span>
                <input
                  type="time"
                  value={settings.water.to}
                  onChange={(e) =>
                    update({ ...settings, water: { ...settings.water, to: e.target.value } })
                  }
                  aria-label={t("toAria")}
                  className="min-h-[45px] flex-1 rounded-md border border-line bg-void px-3 py-2 text-base text-bone focus:border-blood focus:outline-none"
                />
              </div>
            </>
          )}

          {/* system notifications */}
          <div className="mt-6 rounded-xl border border-line px-4 py-3.5">
            {permission === "granted" ? (
              <p className="flex items-center gap-2 text-xs text-ash">
                <span className="text-blood">
                  <Icon name="check" size={13} />
                </span>
                {t("permGranted")}
              </p>
            ) : permission === "denied" ? (
              <p className="text-xs leading-relaxed text-ash">{t("permDenied")}</p>
            ) : permission === "unsupported" ? (
              <p className="text-xs leading-relaxed text-ash">{t("permUnsupported")}</p>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-ash">{t("permAsk")}</p>
                <button type="button" onClick={ask} className="btn btn-ghost mt-3 !py-2.5 text-xs">
                  {t("permButton")}
                </button>
              </>
            )}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-ash-dim">{t("limitNote")}</p>
        </>
      )}
    </section>
  );
}
