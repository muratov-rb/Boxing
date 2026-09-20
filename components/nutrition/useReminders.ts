"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { primeAlarm } from "@/lib/alarm";
import {
  getServerSnapshot,
  getSnapshot,
  registerNotificationWorker,
  setLabels,
  subscribe,
  type ReminderState,
} from "@/lib/reminder-store";

/* React's window onto the scheduler in lib/reminder-store.

   Any number of components may call this; the store counts its subscribers
   and runs exactly one timer regardless, so mounting the runner in AppNav and
   the card on /calories does not schedule anything twice. */
export function useReminders(): ReminderState {
  const t = useTranslations("remind");
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /* The scheduler is outside React and cannot call a hook, so the wording is
     pushed down to it whenever the reader's language changes. */
  useEffect(() => {
    setLabels({
      mealTitle: t("mealTitle"),
      mealBody: (at: string) => t("mealBody", { at }),
      trainingTitle: t("trainingTitle"),
      trainingBody: (at: string) => t("trainingBody", { at }),
      waterTitle: t("waterTitle"),
      waterBody: t("waterBody"),
    });
  }, [t]);

  useEffect(() => {
    registerNotificationWorker();

    /* No browser will let a page make a sound before the visitor has
       interacted with it, and the reminder that needs the sound arrives hours
       later with no interaction anywhere near it. So the first tap or
       keypress of the session — anywhere, on anything — unlocks audio for the
       rest of it. Without this the bell is silent and nothing says why. */
    const unlock = () => primeAlarm();
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return state;
}
