/* ===========================================================================
   RingBornn service worker — notifications only.

   There is deliberately NO fetch handler here. A service worker that
   intercepts requests can serve a stale page long after a deploy, and that
   class of bug is invisible in testing and miserable in production. This one
   never touches the network for the app's own assets.

   It exists because three things are impossible without it:

   1. On Android Chrome `new Notification(...)` throws "Illegal constructor".
      The only way to raise a notification on a phone is
      registration.showNotification(), which must come from here.
   2. On iOS 16.4+ notifications only work for a site installed to the home
      screen, and again only through a service worker.
   3. A reminder that arrives while the app is CLOSED can only arrive as a
      push, and a push can only be received here. That is what the push
      handler below is for, and it is the only part of this that keeps working
      when the phone is locked in a pocket.
   =========================================================================== */

/* Take over immediately rather than waiting for every tab to close —
   otherwise the first visit after a deploy has no worker able to notify. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/* Long-short-long-short-longer. Deliberately unlike the single buzz of a
   message: it should be recognisable through a pocket. Mirrors
   VIBRATE_PATTERN in lib/alarm.ts. */
const VIBRATE = [220, 110, 220, 110, 420];

/* Where a tapped notification may take the user: a path on THIS site.

   Checking only for a leading "/" is the classic open-redirect mistake,
   because "//evil.example" also starts with "/" and is another site entirely;
   a slash followed by a backslash is read the same way by browsers. Same rule
   as lib/safe-next.ts. Not exploitable today -- only this server can push to
   its subscribers, since the push services require our VAPID key -- but this
   is the function that decides where a click goes, so it should not depend on
   who happens to be able to call it. Compared by character code (47 is "/",
   92 is the backslash) so this file never contains a backslash at all. */
function sameSitePath(value) {
  if (typeof value !== "string" || value.charAt(0) !== "/") return "/calories";
  const second = value.charCodeAt(1);
  if (second === 47 || second === 92) return "/calories";
  return value;
}

/* -------------------------------------------------------------------------
   A reminder sent by the server, which is what makes this work with the app
   shut. The payload says which slot it is, so the notification can be headed
   "Lunch" rather than something generic.
   ------------------------------------------------------------------------- */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    /* A push with no body, or a body that is not ours. Still show something:
       the subscription was made with userVisibleOnly, so a push that raises
       no notification is a promise broken to the browser, and browsers
       eventually respond by showing their own "this site ran in the
       background" notice instead. */
  }

  const title = typeof data.title === "string" && data.title ? data.title : "RingBornn";
  const url = sameSitePath(data.url);

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, {
        body: typeof data.body === "string" ? data.body : "",
        tag: typeof data.tag === "string" ? data.tag : "ringbornn",
        renotify: true, // replaces the previous one, but still alerts
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        vibrate: VIBRATE,
        timestamp: Date.now(),
        data: { url: url },
      });

      /* If the app happens to be open, let it ring its own bell and draw the
         in-app card. The page does not run its own timer while push is
         active — one source of truth is what stops the same reminder
         arriving twice — so this message is how it finds out. */
      const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of open) {
        client.postMessage({ type: "ringbornn-reminder", reminder: data });
      }
    })(),
  );
});

/* A push service may retire a subscription and issue a new one. Nothing is
   re-registered from here on purpose: this worker does not know the device's
   schedule, and posting a subscription without one would overwrite the saved
   schedule with an empty list and silently switch the reminders off. The next
   time the app is opened it notices the endpoint has changed and re-registers
   it properly, schedule and all. */
self.addEventListener("pushsubscriptionchange", () => {
  /* Intentionally empty — see above. */
});

/* Tapping the notification should land on the page that raised it, reusing an
   open tab if there is one. Opening a second copy of the app is how people end
   up with six tabs and two of them logged out. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = sameSitePath(event.notification.data && event.notification.data.url);
  event.waitUntil(
    (async () => {
      const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of open) {
        if (client.url.startsWith(self.location.origin)) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(target);
            } catch {
              /* a cross-origin or closing tab — focusing it is enough */
            }
          }
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
