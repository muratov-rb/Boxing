/* The public VAPID key, and nothing else.

   It lives apart from lib/push-client because the root layout — a server
   component — needs the key's NAME to put the value on the bridge, and
   push-client is a "use client" module that pulls in localStorage-backed
   tracking code. Importing that from the layout would drag the whole client
   boundary into it for the sake of one string.

   Same shape and same reasoning as lib/paddle-client: the value reaches the
   browser at request time on window.__PRESSURE_ENV rather than being inlined
   at build time, so a deploy built before the variable was set does not bake
   an empty string into the bundle. */

/** Key on window.__PRESSURE_ENV. Set in app/layout.tsx, read below. */
export const VAPID_KEY = "VAPID_PUBLIC_KEY";

/**
 * The application server key the browser subscribes with.
 *
 * Public by definition: it identifies this server to the push service and
 * authorises nothing on its own. VAPID_PRIVATE_KEY is the half that signs
 * each push, and it must never leave the server.
 */
export function vapidPublicKey(): string {
  if (typeof window !== "undefined") {
    return window.__PRESSURE_ENV?.[VAPID_KEY] ?? "";
  }
  return process.env.VAPID_PUBLIC_KEY ?? "";
}
