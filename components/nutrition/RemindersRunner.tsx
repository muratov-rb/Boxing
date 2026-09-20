"use client";

import { useReminders } from "./useReminders";

/* Renders nothing; keeps the reminder scheduler alive.

   Mounted by AppNav, which every signed-in page renders, because a reminder
   set for 13:00 has to arrive at 13:00 whatever page you are looking at. It
   used to run inside ReminderCard on /calories only, so the single commonest
   way to miss one was to be using the app at the time. */
export function RemindersRunner() {
  useReminders();
  return null;
}
