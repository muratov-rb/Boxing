/* ===========================================================================
   RingBornn service worker — notifications only.

   There is deliberately NO fetch handler here. A service worker that
   intercepts requests can serve a stale page long after a deploy, and that
   class of bug is invisible in testing and miserable in production. This one
   never touches the network: it exists because two things are impossible
   without it.

   1. On Android Chrome `new Notification(...)` throws "Illegal constructor".
      The only way to raise a notification on a phone is
      registration.showNotification(), which must come from here.
   2. On iOS 16.4+ notifications only work for a site installed to the home
      screen, and again only through a service worker.

   The page raises notifications by calling showNotification() on this
   worker's registration, so the only thing left here is what the page cannot
   do: react to the tap once it is no longer on screen.
   =========================================================================== */

/* Take over immediately rather than waiting for every tab to close —
   otherwise the first visit after a deploy has no worker able to notify. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/* Tapping the notification should land on the page that raised it, reusing an
   open tab if there is one. Opening a second copy of the app is how people end
   up with six tabs and two of them logged out. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/calories";
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
