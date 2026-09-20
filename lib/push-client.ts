"use client";

import { LOCALE_COOKIE } from "@/i18n/locales";
import { mealMinutesToday } from "@/lib/tracking";
import { vapidPublicKey } from "@/lib/push-keys";
import type { ReminderSettings } from "@/lib/reminders";

/* ===========================================================================
   Registering this device for reminders that arrive with the app closed.

   The schedule goes to the server WITH the subscription. That looks like it
   contradicts reminders being device-local, and it does not: each push
   subscription is one device, so each device still carries its own hours. The
   server is only holding a copy, because a closed app cannot tell anyone what
   time it wanted to be woken.

   Everything here fails soft. No permission, no service worker, an older
   browser, a push service that will not talk to us — all of it ends with the
   in-app scheduler still running exactly as before. Push is an upgrade on top
   of that, never a replacement for it.
   =========================================================================== */

/** Remembers the last schedule we sent, so opening the app fifty times does
    not write the same row fifty times. */
const SYNCED_KEY = "pressure.pushSynced";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    vapidPublicKey().length > 0
  );
}

/**
 * The VAPID key is base64url; subscribe() wants raw bytes.
 *
 * Written without a single backslash: base64url's two substitutions need no
 * escaping, and an escape in this file is exactly the kind of thing that has
 * been silently corrupted here before.
 */
function toBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = base64url + "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  /* Backed by an explicit ArrayBuffer so the type is Uint8Array<ArrayBuffer>
     rather than <ArrayBufferLike>: subscribe() will not accept a view that
     might sit on a SharedArrayBuffer. */
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function currentLocale(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(LOCALE_COOKIE + "="));
  return match ? decodeURIComponent(match.slice(LOCALE_COOKIE.length + 1)) : "en";
}

function deviceTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function payloadFor(settings: ReminderSettings, subscription: PushSubscription) {
  const json = subscription.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  return {
    subscription: { endpoint: json.endpoint, keys: json.keys },
    /* Only what the server needs to decide a slot is due. Labels come along
       because the notification is headed with the slot's own name. */
    slots: settings.slots.map((s) => ({
      id: s.id,
      label: s.label,
      time: s.time,
      kind: s.kind ?? "meal",
    })),
    water: settings.water,
    enabled: settings.enabled,
    tz: deviceTz(),
    locale: currentLocale(),
    mealMinutes: mealMinutesToday(),
  };
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    /* `ready` rather than getRegistration: immediately after the first
       register() the worker is still installing and has no pushManager. */
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

/** The device's existing subscription, if it has one. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await registration();
  if (!reg) return null;
  try {
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Subscribe this device and save its schedule.
 *
 * Only called once notification permission is already granted — subscribing
 * is what triggers the browser's own prompt otherwise, and a prompt that
 * appears without anyone asking for it is how a site gets permanently
 * blocked.
 */
export async function enablePush(settings: ReminderSettings): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  const reg = await registration();
  if (!reg) return false;

  try {
    const existing = await reg.pushManager.getSubscription();
    const subscription =
      existing ??
      (await reg.pushManager.subscribe({
        /* Required by Chrome, and a promise we keep: every push this app
           sends raises a notification. */
        userVisibleOnly: true,
        applicationServerKey: toBytes(vapidPublicKey()),
      }));

    const body = payloadFor(settings, subscription);
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return false;

    try {
      localStorage.setItem(SYNCED_KEY, JSON.stringify(body));
    } catch {
      /* private mode — the only cost is a redundant write next time */
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Push the current schedule up if it has changed.
 *
 * Called when settings change and when a meal is logged, so the server's copy
 * of "what has been eaten today" does not go stale while the app is open.
 */
export async function syncPush(settings: ReminderSettings): Promise<void> {
  if (!pushSupported() || Notification.permission !== "granted") return;
  const subscription = await currentSubscription();
  if (!subscription) return;

  const body = payloadFor(settings, subscription);
  const serialised = JSON.stringify(body);
  try {
    if (localStorage.getItem(SYNCED_KEY) === serialised) return;
  } catch {
    /* unreadable storage just means we send it anyway */
  }

  try {
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: serialised,
    });
    if (res.ok) localStorage.setItem(SYNCED_KEY, serialised);
  } catch {
    /* offline; the next change or page load tries again */
  }
}

/** Stop this device receiving pushes, and forget it server-side. */
export async function disablePush(): Promise<void> {
  const subscription = await currentSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  try {
    await subscription.unsubscribe();
  } catch {
    /* already gone as far as the browser is concerned */
  }
  try {
    await fetch("/api/push/subscribe?endpoint=" + encodeURIComponent(endpoint), {
      method: "DELETE",
    });
  } catch {
    /* the row will be removed on its next failed send instead */
  }
  try {
    localStorage.removeItem(SYNCED_KEY);
  } catch {
    /* nothing to clean up */
  }
}
