/* ===========================================================================
   The reminder scheduler — one of them, for the whole app.

   It used to live inside ReminderCard, which had two consequences nobody
   wanted. The card is only on /calories, so a reminder set for 13:00 never
   arrived if you happened to be on /train at 13:00. And the delivery it used,
   `new Notification(...)`, THROWS on Android Chrome ("Illegal constructor") —
   into a catch that swallowed it, so on a phone the feature did nothing at
   all and said nothing about it.

   So the schedule now lives here, outside React: a module-level store that
   any number of components can subscribe to while exactly one timer runs
   behind them (see the refcount in subscribe). AppNav mounts a subscriber, so
   it is running on every signed-in page.
   =========================================================================== */

import {
  dueReminders,
  markFired,
  parseHhMm,
  type DueReminder,
  type ReminderSettings,
} from "@/lib/reminders";
import { VIBRATE_PATTERN, playAlarm, vibrateAlarm } from "@/lib/alarm";
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

export interface FiredReminder extends DueReminder {
  /** epoch ms, so a breakfast nudge stops being shown at nine in the evening */
  firedAt: number;
}

export interface ReminderState {
  settings: ReminderSettings | null;
  due: FiredReminder[];
  /** True once this device is registered for server-sent reminders, which is
      what makes them arrive with the app closed. The card says so, because
      "works when shut" is the whole difference and people should be able to
      see which mode they are in. */
  pushActive: boolean;
}

/** Wording comes from next-intl, which is React-only, so a subscriber hands
    the strings in and the scheduler uses whatever it was last given. */
export interface ReminderLabels {
  mealTitle: string;
  mealBody: (at: string) => string;
  trainingTitle: string;
  trainingBody: (at: string) => string;
  waterTitle: string;
  waterBody: string;
}

const EMPTY: ReminderState = { settings: null, due: [], pushActive: false };
const SHOW_FOR_MS = 3 * 60 * 60 * 1000;

/* With push active the server is the one that notifies, and this timer's only
   remaining job is to ring the bell for something happening RIGHT NOW while
   you are looking at the page. Two minutes, so opening the app at six o'clock
   does not sound the bell for a five-o'clock reminder the server already
   delivered to the lock screen. */
const BELL_WINDOW_MIN = 2;

let snapshot: ReminderState = EMPTY;
let labels: ReminderLabels | null = null;
const listeners = new Set<() => void>();

/* One timer for any number of subscribers. */
let subscribers = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

function set(next: Partial<ReminderState>): void {
  snapshot = { ...snapshot, ...next };
  emit();
}

export function getSnapshot(): ReminderState {
  return snapshot;
}

/** Server render has no localStorage and must return a stable object, or
    useSyncExternalStore loops forever redefining the snapshot. */
export function getServerSnapshot(): ReminderState {
  return EMPTY;
}

export function setLabels(next: ReminderLabels): void {
  labels = next;
}

/** Told by the React layer once it has checked whether this device holds a
    push subscription. It changes who does the notifying — see tick(). */
export function setPushActive(active: boolean): void {
  if (snapshot.pushActive === active) return;
  set({ pushActive: active });
}

/** The only way settings change. Writes through to localStorage so the next
    page load and any other open tab agree with what is on screen. */
export function updateSettings(next: ReminderSettings): void {
  saveReminders(next);
  set({ settings: next, due: next.enabled ? snapshot.due : [] });
  schedule();
}

/** First run on this device: name the starter slots in the reader's language.
    In memory only — persisting here would mark the settings as the user's own
    and freeze whichever language they happened to open the app in. */
export function seedSlotLabels(names: Record<string, string>): void {
  const current = snapshot.settings;
  if (!current) return;
  set({
    settings: {
      ...current,
      slots: current.slots.map((slot) => ({ ...slot, label: names[slot.id] ?? slot.label })),
    },
  });
}

/* --------------------------------- delivery ------------------------------ */

/* Notification options carry fields the DOM types have not caught up with.
   They are real, they are what makes a phone buzz, and dropping them to
   satisfy the compiler would remove the point of the exercise. */
type RichNotificationOptions = NotificationOptions & {
  vibrate?: number[];
  renotify?: boolean;
};

function options(body: string, tag: string): RichNotificationOptions {
  return {
    body,
    tag, // one per slot per day: replaces rather than stacking
    renotify: true, // ...but still make a sound when it replaces
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: VIBRATE_PATTERN,
    data: { url: "/calories" },
  };
}

/** Raise a system notification. Returns false when the browser would not, so
    the caller knows the in-app card is the only thing that got through. */
async function showSystemNotification(
  title: string,
  body: string,
  tag: string,
): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  /* The service worker first, and not merely as a fallback: on Android Chrome
     it is the ONLY path that works, and a home-screen install on iOS has no
     other. The constructor below is for desktop browsers without one. */
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(title, options(body, tag));
      return true;
    }
  } catch {
    /* fall through to the constructor */
  }

  try {
    new Notification(title, options(body, tag));
    return true;
  } catch {
    return false;
  }
}

/** Sound and buzz, honouring the two switches. Runs whether or not the system
    notification got through — sitting in the tab with the page open is
    exactly when the OS is least likely to make a noise of its own. */
function alarm(settings: ReminderSettings): void {
  if (settings.sound) playAlarm();
  if (settings.vibrate) vibrateAlarm();
}

/** Fire one now, for the Test button. Deliberately does not touch lastFired:
    testing the bell must not consume one of today's real reminders. */
export async function testReminder(): Promise<boolean> {
  const settings = snapshot.settings;
  if (!settings) return false;
  alarm(settings);
  const title = labels?.mealTitle ?? "RingBornn";
  const body = labels?.waterBody ?? "";
  return showSystemNotification(title, body, "test:" + Date.now());
}

/* --------------------------------- the tick ------------------------------ */

function tick(): void {
  const settings = snapshot.settings;
  if (!settings) return;

  const now = new Date();
  const today = todayKey();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  /* Drop anything too old to still be worth showing, so opening the app in
     the evening does not greet you with this morning's breakfast nudge. */
  const fresh = snapshot.due.filter((d) => now.getTime() - d.firedAt < SHOW_FOR_MS);

  if (!settings.enabled) {
    if (snapshot.due.length > 0) set({ due: [] });
    return;
  }

  const profile = loadProfile();
  const due = dueReminders({
    now,
    today,
    settings,
    loggedMealMinutes: mealMinutesToday(),
    waterMl: waterToday(),
    waterTargetMl: waterTarget(profile, trainedToday()),
  });

  if (due.length === 0) {
    /* The old code returned here without writing, which meant the card could
       never clear a stale nudge once one had been shown. */
    if (fresh.length !== snapshot.due.length) set({ due: fresh });
    return;
  }

  /* Who notifies depends on whether this device is registered for push.

     If it is, the server raises the notification — including when the app is
     shut, which is the entire point — and this timer must NOT raise a second
     one. Two notifications with the same tag collapse into one on screen, but
     the phone alerts twice, and being buzzed twice for one reminder is worse
     than either half of the feature being missing.

     What the page keeps in that case is the bell: it is instant, where a push
     takes a second or two to come back round, and it is what you want while
     actually looking at the screen. Restricted to reminders happening right
     now, so opening the app later does not re-ring old ones. */
  const ringing = snapshot.pushActive
    ? due.filter((item) => {
        if (item.kind === "water") return true; // water is never pushed
        const at = parseHhMm(item.at);
        return at === null || nowMin - at <= BELL_WINDOW_MIN;
      })
    : due;

  if (ringing.length > 0) alarm(settings);

  if (!snapshot.pushActive) {
    for (const item of due) {
      /* Water has no slot and therefore no name of its own; the other two are
         the user's rows, so their own wording leads — a reminder called
         "Pre-workout shake" should say that, not "time to eat". */
      const owned = item.kind !== "water" && item.label.trim().length > 0;
      const byKind = {
        meal: { title: labels?.mealTitle, body: labels?.mealBody(item.at) },
        training: { title: labels?.trainingTitle, body: labels?.trainingBody(item.at) },
        water: { title: labels?.waterTitle, body: labels?.waterBody },
      }[item.kind];

      void showSystemNotification(
        owned ? item.label : (byKind.title ?? "RingBornn"),
        byKind.body ?? "",
        item.key,
      );
    }
  }

  /* Marked fired whether or not the system notification got through — the
     in-app card has shown it, and firing again would be nagging. */
  const next = markFired(
    settings,
    due.map((d) => d.key),
    today,
  );
  saveReminders(next);
  set({
    settings: next,
    due: [...fresh, ...due.map((d) => ({ ...d, firedAt: now.getTime() }))],
  });
}

/* Wake on the minute rather than every sixty seconds from whenever the page
   happened to load. A reminder set for 13:00 could previously arrive at
   13:00:59; now it lands within a quarter-second of the minute it names. */
function msToNextMinute(): number {
  return 60_000 - (Date.now() % 60_000) + 250;
}

function schedule(): void {
  if (timer) clearTimeout(timer);
  if (subscribers === 0) return;
  timer = setTimeout(() => {
    tick();
    schedule();
  }, msToNextMinute());
}

/* Background tabs get their timers throttled, and a phone that locks may stop
   them entirely — so catch up the moment the page is looked at again rather
   than waiting on a timer that has been asleep. */
function onWake(): void {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
  tick();
  schedule();
}

/* Another tab firing the same reminder writes lastFired to localStorage.
   Without this, this tab holds a stale copy and rings a second time. */
function onStorage(event: StorageEvent): void {
  if (event.key && !event.key.includes("remind")) return;
  set({ settings: loadReminders() });
}

/* A push arrived while the app was open. The worker showed the notification
   and then told us, so the page can put it on the card and ring the bell —
   the two things a service worker cannot do, since it has no DOM and no
   audio. Guarded on lastFired so a push that merely confirms what this tab
   already rang for does not ring it again. */
function onWorkerMessage(event: MessageEvent): void {
  const message = event.data as { type?: string; reminder?: Record<string, unknown> } | null;
  if (!message || message.type !== "ringbornn-reminder") return;

  const settings = snapshot.settings;
  const reminder = message.reminder;
  if (!settings || !reminder) return;

  const key = typeof reminder.tag === "string" ? reminder.tag : "";
  if (!key || settings.lastFired[key]) return;

  const kind: DueReminder["kind"] =
    reminder.kind === "training" ? "training" : reminder.kind === "water" ? "water" : "meal";
  const item: FiredReminder = {
    kind,
    key,
    at: typeof reminder.at === "string" ? reminder.at : "",
    label: typeof reminder.label === "string" ? reminder.label : "",
    firedAt: Date.now(),
  };

  alarm(settings);
  const next = markFired(settings, [key], todayKey());
  saveReminders(next);
  set({ settings: next, due: [...snapshot.due, item] });
}

/** Subscribe, and start the scheduler if this is the first subscriber. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  subscribers += 1;

  if (subscribers === 1) {
    if (!snapshot.settings) set({ settings: loadReminders() });
    window.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);
    window.addEventListener("storage", onStorage);
    navigator.serviceWorker?.addEventListener("message", onWorkerMessage);
    tick();
    schedule();
  }

  return () => {
    listeners.delete(listener);
    subscribers -= 1;
    if (subscribers === 0) {
      if (timer) clearTimeout(timer);
      timer = null;
      window.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
      window.removeEventListener("storage", onStorage);
      navigator.serviceWorker?.removeEventListener("message", onWorkerMessage);
    }
  };
}

/** Register the notification worker. Idempotent, so it is safe to call from
    every mount. The worker has no fetch handler and therefore cannot serve a
    stale page. */
export function registerNotificationWorker(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    /* unsupported, blocked by policy, or running over http — the constructor
       path still covers desktop, and the in-app card always works */
  });
}
