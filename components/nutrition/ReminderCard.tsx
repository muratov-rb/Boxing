"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { hasSavedReminders } from "@/lib/tracking";
import { primeAlarm } from "@/lib/alarm";
import { seedSlotLabels, testReminder, updateSettings } from "@/lib/reminder-store";
import { useReminders } from "./useReminders";
import {
  MAX_SLOTS,
  SLOT_LABEL_MAX,
  WATER_INTERVAL_CHOICES,
  newSlotId,
  type ReminderSlot,
} from "@/lib/reminders";

/* Reminders to eat and drink.

   Three delivery paths, because no single one of them is reliable. A system
   notification is what people want, but it needs permission and on iOS needs
   the site installed to the home screen first. Sound and vibration come from
   the page itself, which is what actually gets noticed while the app is open
   — the OS is least likely to make a noise of its own precisely then. And the
   in-app card underneath always works.

   The schedule is NOT run from here any more; it lives in lib/reminder-store
   and runs on every page. This component is the settings for it.

   Permission is requested from a button press and never on load: browsers
   demote sites that ask cold, and so do people. */

type Permission = "unsupported" | "default" | "granted" | "denied";

function readPermission(): Permission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as Permission;
}

/* iOS refuses web notifications outright until the site is on the home
   screen, so telling an iPhone user to "allow notifications" is advice that
   cannot work. Detected by capability, not by user agent: standalone means
   installed, and no Notification means it will not be offered. */
function needsInstallFirst(): boolean {
  if (typeof window === "undefined") return false;
  const iOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const installed =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iOS && !installed;
}

export function ReminderCard() {
  const t = useTranslations("remind");
  const { settings, due } = useReminders();
  const [permission, setPermission] = useState<Permission>("default");
  const [installHint, setInstallHint] = useState(false);
  const [tested, setTested] = useState(false);

  useEffect(() => {
    setPermission(readPermission());
    setInstallHint(needsInstallFirst());
  }, []);

  /* First run on this device: give the three starter slots names in the
     reader's language. Guarded on hasSavedReminders so a returning user's own
     names are never overwritten — including if they renamed one back to
     something that happens to match a default. */
  useEffect(() => {
    if (hasSavedReminders()) return;
    seedSlotLabels({ m1: t("slotBreakfast"), m2: t("slotLunch"), m3: t("slotDinner") });
  }, [t]);

  /* Every write goes through the store, which persists it and re-arms the
     timer. Each of these is a real click, so it doubles as the gesture that
     unlocks audio for the session. */
  const update = useCallback(
    (next: Parameters<typeof updateSettings>[0]) => {
      primeAlarm();
      updateSettings(next);
    },
    [],
  );

  const ask = async () => {
    if (!("Notification" in window)) return;
    primeAlarm();
    try {
      setPermission((await Notification.requestPermission()) as Permission);
    } catch {
      setPermission(readPermission());
    }
  };

  const runTest = async () => {
    primeAlarm();
    await testReminder();
    setTested(true);
    window.setTimeout(() => setTested(false), 4000);
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
      slots: [...settings.slots, { id: newSlotId(), label: t("slotNewName"), time: "16:00" }],
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
          {due.length > 0 && (
            <ul className="mt-5 space-y-2">
              {due.map((d) => (
                <li
                  key={d.key}
                  className="flex items-center gap-2.5 rounded-xl border border-blood/40 bg-blood/10 px-3.5 py-2.5 text-sm text-bone"
                >
                  <span className="text-blood">
                    <Icon
                      name={
                        d.kind === "water"
                          ? "water"
                          : d.kind === "training"
                            ? "gloves"
                            : "calorie"
                      }
                      size={15}
                    />
                  </span>
                  {d.kind === "water"
                    ? t("dueWater")
                    : t("dueSlot", { name: d.label || t("slotNewName"), at: d.at })}
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
              /* Four controls will not fit on one line on a phone — the time
                 field was already clipping to "09:42 AN" with three. The name
                 takes its own line below the sm breakpoint and the rest share
                 the next one, which also lets the time field stop truncating. */
              <li key={slot.id} className="flex flex-wrap items-center gap-2">
                <input
                  value={slot.label}
                  onChange={(e) =>
                    setSlot(slot.id, { label: e.target.value.slice(0, SLOT_LABEL_MAX) })
                  }
                  placeholder={t("slotNamePlaceholder")}
                  maxLength={SLOT_LABEL_MAX}
                  aria-label={t("slotNameAria")}
                  className="min-h-[45px] w-full min-w-0 rounded-md border border-line bg-void px-3 py-2 text-base text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none sm:w-auto sm:flex-1"
                />
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  {/* Meal or training. A training slot is not cancelled by
                      having just eaten, and says "time to train" rather than
                      "your meal is due" — so it has to be a real setting and
                      not just a name the person typed. */}
                  <button
                    type="button"
                    onClick={() =>
                      setSlot(slot.id, {
                        kind: slot.kind === "training" ? "meal" : "training",
                      })
                    }
                    aria-label={t("slotKindAria")}
                    title={slot.kind === "training" ? t("slotKindTraining") : t("slotKindMeal")}
                    className={`grid h-[45px] w-[45px] shrink-0 place-items-center rounded-md border transition-colors ${
                      slot.kind === "training"
                        ? "border-blood/60 bg-blood/10 text-blood"
                        : "border-line text-ash-dim hover:border-blood/50"
                    }`}
                  >
                    <Icon name={slot.kind === "training" ? "gloves" : "calorie"} size={16} />
                  </button>
                  <input
                    type="time"
                    value={slot.time}
                    onChange={(e) => setSlot(slot.id, { time: e.target.value })}
                    aria-label={t("slotTimeAria")}
                    className="min-h-[45px] min-w-0 flex-1 rounded-md border border-line bg-void px-2 py-2 text-base text-bone focus:border-blood focus:outline-none sm:w-[7.5rem] sm:flex-none"
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
                </div>
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

          {/* how it gets your attention */}
          <p className="mt-6 font-condensed text-xs uppercase tracking-widest text-ash">
            {t("alertLabel")}
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {(
              [
                /* The speaker icon crosses itself out when sound is off, so
                   the state reads at a glance and not only from the colour. */
                {
                  key: "sound",
                  on: settings.sound,
                  icon: settings.sound ? "sound" : "soundOff",
                  label: t("soundLabel"),
                },
                { key: "vibrate", on: settings.vibrate, icon: "bolt", label: t("vibrateLabel") },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                role="switch"
                aria-checked={opt.on}
                onClick={() => update({ ...settings, [opt.key]: !opt.on })}
                className={`flex min-h-[45px] items-center justify-center gap-2 rounded-xl border px-3 font-condensed text-xs uppercase tracking-wider transition-colors ${
                  opt.on
                    ? "border-blood bg-blood/10 text-bone"
                    : "border-line text-ash-dim hover:border-blood/50"
                }`}
              >
                <Icon name={opt.icon} size={14} />
                {opt.label}
              </button>
            ))}
          </div>

          {/* Hearing it once is the only way to know it works — and the tap
              itself is what unlocks audio for the rest of the session. */}
          <button type="button" onClick={runTest} className="btn btn-ghost mt-2 w-full !py-2.5 text-xs">
            {tested ? t("testDone") : t("testButton")}
          </button>

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
            {installHint ? (
              /* Offering the permission button on an iPhone that has not
                 installed the site would be offering something that cannot
                 work — iOS simply has no Notification API in Safari tabs. */
              <p className="text-xs leading-relaxed text-ash">{t("permInstallFirst")}</p>
            ) : permission === "granted" ? (
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
