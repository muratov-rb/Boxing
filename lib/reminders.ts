/* ===========================================================================
   Eating and drinking reminders.

   Local to the device and deliberately not synced: a phone and a laptop are
   used at different times of day, and pushing one device's schedule onto the
   other would produce reminders at the wrong hours.

   The scheduling rule that matters is DON'T NAG. A reminder fires at most once
   per slot per day, and a meal slot is skipped entirely if something was
   already logged near that time — being told to eat lunch while still chewing
   it is how a person turns notifications off for good.
   =========================================================================== */

export interface WaterReminder {
  enabled: boolean;
  /** Gap between nudges, in minutes. */
  everyMinutes: number;
  /** Quiet hours: only remind between these, as "HH:MM". */
  from: string;
  to: string;
}

/* A reminder the user owns: their label, their time, and removable.

   The three meals started as a fixed array of times, which meant the app
   decided that everyone eats three times a day at hours it chose. A slot is
   now just a row — rename it "Pre-workout shake", move it to 16:45, delete the
   one you don't want. */
export interface ReminderSlot {
  id: string;
  label: string;
  /** "HH:MM" in the device's own timezone. */
  time: string;
}

export const MAX_SLOTS = 8;
export const SLOT_LABEL_MAX = 40;

export interface ReminderSettings {
  enabled: boolean;
  slots: ReminderSlot[];
  water: WaterReminder;
  /** slot key → ISO timestamp it last fired, so a reload cannot re-fire it. */
  lastFired: Record<string, string>;
}

/** Labels are seeded from the message catalogue by the UI; these are the
    fallbacks for a device whose settings are created before that runs. */
export const DEFAULT_SLOTS: ReminderSlot[] = [
  { id: "m1", label: "Breakfast", time: "08:00" },
  { id: "m2", label: "Lunch", time: "13:00" },
  { id: "m3", label: "Dinner", time: "19:00" },
];

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: false,
  slots: DEFAULT_SLOTS,
  water: { enabled: true, everyMinutes: 120, from: "08:00", to: "22:00" },
  lastFired: {},
};

export function newSlotId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Settings saved by the build that only knew about a `meals: string[]` field.
    Upgrading in place beats discarding: someone who already set their hours
    should not find them reset. */
export function migrateSettings(
  saved: Partial<ReminderSettings> & { meals?: unknown },
): ReminderSettings {
  let slots = Array.isArray(saved.slots) ? saved.slots.filter(isSlot) : [];

  if (slots.length === 0 && Array.isArray(saved.meals)) {
    slots = (saved.meals as unknown[])
      .filter((t): t is string => typeof t === "string")
      .map((time, i) => ({
        id: `m${i + 1}`,
        label: DEFAULT_SLOTS[i]?.label ?? `Meal ${i + 1}`,
        time,
      }));
  }

  return {
    ...DEFAULT_REMINDERS,
    ...saved,
    slots: slots.length ? slots.slice(0, MAX_SLOTS) : DEFAULT_SLOTS,
    water: { ...DEFAULT_REMINDERS.water, ...(saved.water ?? {}) },
    lastFired: saved.lastFired ?? {},
  };
}

function isSlot(v: unknown): v is ReminderSlot {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as ReminderSlot).id === "string" &&
    typeof (v as ReminderSlot).time === "string"
  );
}

export const WATER_INTERVAL_CHOICES = [60, 90, 120, 180] as const;

/** Minutes either side of a meal slot that count as "already eaten". */
export const MEAL_GRACE_MINUTES = 45;

/* ------------------------------- time helpers ---------------------------- */

/** "HH:MM" → minutes since midnight. Returns null for anything malformed, so
    a corrupted setting disables that slot instead of firing at midnight. */
export function parseHhMm(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function formatHhMm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Inclusive window that also handles a range crossing midnight. */
export function withinWindow(now: number, from: number, to: number): boolean {
  return from <= to ? now >= from && now <= to : now >= from || now <= to;
}

/* --------------------------------- due ----------------------------------- */

export type DueKind = "meal" | "water";

export interface DueReminder {
  kind: DueKind;
  /** Stable per-day identity, e.g. "meal:2026-08-26:m2". */
  key: string;
  /** The slot's time, for display. */
  at: string;
  /** The slot's own name, so the notification can say "Pre-workout shake". */
  label: string;
}

export interface DueInput {
  now: Date;
  /** YYYY-MM-DD for `now`, passed in so the caller owns the date convention. */
  today: string;
  settings: ReminderSettings;
  /** Minutes-of-day for every meal already logged today. */
  loggedMealMinutes: number[];
  /** Millilitres drunk today, used only to skip water nudges once done. */
  waterMl: number;
  waterTargetMl: number;
}

/**
 * What should fire right now — pure, so the awkward cases (midnight windows,
 * a meal logged just before its slot, a reload five minutes later) can be
 * checked directly rather than by waiting around for a timer.
 */
export function dueReminders(input: DueInput): DueReminder[] {
  const { now, today, settings, loggedMealMinutes, waterMl, waterTargetMl } = input;
  if (!settings.enabled) return [];

  const out: DueReminder[] = [];
  const nowMin = minutesOfDay(now);

  for (const slot of settings.slots) {
    const at = parseHhMm(slot.time);
    if (at === null || nowMin < at) continue;

    /* Stale slots don't fire. Opening the app at 21:00 should not deliver a
       stack of reminders for breakfast, lunch and dinner all at once. */
    if (nowMin - at > 90) continue;

    /* Keyed by slot id, not by time: renaming or moving a slot must not make
       it fire a second time on the same day. */
    const key = `meal:${today}:${slot.id}`;
    if (settings.lastFired[key]) continue;

    const alreadyEaten = loggedMealMinutes.some(
      (m) => Math.abs(m - at) <= MEAL_GRACE_MINUTES,
    );
    if (alreadyEaten) continue;

    out.push({ kind: "meal", key, at: slot.time, label: slot.label });
  }

  const w = settings.water;
  if (w.enabled && waterMl < waterTargetMl) {
    const from = parseHhMm(w.from);
    const to = parseHhMm(w.to);
    if (from !== null && to !== null && withinWindow(nowMin, from, to)) {
      /* Bucket the day into fixed intervals from the window's start, so the
         key is stable no matter when the page happened to be open. */
      const bucket = Math.floor((nowMin - from) / Math.max(15, w.everyMinutes));
      const key = `water:${today}:${bucket}`;
      if (!settings.lastFired[key] && bucket >= 1) {
        out.push({ kind: "water", key, at: formatHhMm(nowMin), label: "" });
      }
    }
  }

  return out;
}

/** Record a fire, dropping keys from previous days so the map cannot grow
    without bound on a device that is never cleared. */
export function markFired(
  settings: ReminderSettings,
  keys: string[],
  today: string,
): ReminderSettings {
  const lastFired: Record<string, string> = {};
  for (const [k, v] of Object.entries(settings.lastFired)) {
    if (k.includes(`:${today}:`)) lastFired[k] = v;
  }
  const stamp = new Date().toISOString();
  for (const k of keys) lastFired[k] = stamp;
  return { ...settings, lastFired };
}
