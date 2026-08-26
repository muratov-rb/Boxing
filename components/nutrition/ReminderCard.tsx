"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import {
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
  WATER_INTERVAL_CHOICES,
  dueReminders,
  markFired,
  type ReminderSettings,
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
  const [dueNow, setDueNow] = useState<{ kind: string; at: string }[]>([]);
  /* Held in a ref as well as state: the interval closes over this and must see
     the latest settings without being torn down and rebuilt every keystroke. */
  const settingsRef = useRef<ReminderSettings | null>(null);

  useEffect(() => {
    const s = loadReminders();
    setSettings(s);
    settingsRef.current = s;
    setPermission(readPermission());
  }, []);

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

      setDueNow(due.map((d) => ({ kind: d.kind, at: d.at })));

      if (readPermission() === "granted") {
        for (const d of due) {
          try {
            new Notification(d.kind === "meal" ? t("mealTitle") : t("waterTitle"), {
              body: d.kind === "meal" ? t("mealBody", { at: d.at }) : t("waterBody"),
              tag: d.key, // replaces rather than stacks if one is still on screen
            });
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

  const setMeal = (i: number, value: string) => {
    const meals = [...settings.meals];
    meals[i] = value;
    update({ ...settings, meals });
  };

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
                  {d.kind === "meal" ? t("dueMeal", { at: d.at }) : t("dueWater")}
                </li>
              ))}
            </ul>
          )}

          {/* meal times */}
          <p className="mt-6 font-condensed text-xs uppercase tracking-widest text-ash">
            {t("mealsLabel")}
          </p>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {settings.meals.map((slot, i) => (
              <input
                key={i}
                type="time"
                value={slot}
                onChange={(e) => setMeal(i, e.target.value)}
                aria-label={t("mealAria", { n: i + 1 })}
                className="min-h-[45px] w-full rounded-md border border-line bg-void px-3 py-2 text-base text-bone focus:border-blood focus:outline-none"
              />
            ))}
          </div>

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
