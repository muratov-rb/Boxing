/* ===========================================================================
   Which addresses may be stored, and pushed to, as a "device".

   A push subscription's endpoint is a URL the browser hands us, and the server
   then sends an HTTPS request to it -- once a minute when a reminder is due,
   and on demand from the Test button. The subscribe route used to accept
   anything that started with "https://". That made the push system a
   server-side request relay: register a "device" at any address, and this
   server would post to it on schedule, from our domain, at our cost. It was
   proven live in the 2026-09-22 security audit by registering a device at a
   page on our own domain and watching the dispatcher send to it.

   Real browsers only ever produce endpoints on a handful of push services,
   run by the browser vendors. Anything else is not a device.

   No regex anywhere: the host is taken from the WHATWG URL parser, which is
   the same parser the push library uses to decide where to connect. A
   hand-written pattern that disagreed with it on some edge case
   (credentials, a trailing dot, an encoded character) would be the bypass.
   =========================================================================== */

/** Exact hosts the browsers use. */
const EXACT_HOSTS = new Set([
  "fcm.googleapis.com", // Chrome, Android, Opera, Brave, Samsung Internet
  "android.googleapis.com", // legacy GCM endpoints still issued to old installs
  "updates.push.services.mozilla.com", // Firefox
  "web.push.apple.com", // Safari 16+, iOS 16.4+ home-screen installs
]);

/** Services that hand out per-region subdomains. The leading dot means a
    subdomain is required: "notify.windows.com" alone is not accepted, and
    "notify.windows.com.attacker.example" does not end with it. */
const HOST_SUFFIXES = [
  ".notify.windows.com", // Edge on Windows (wns2-*.notify.windows.com)
  ".push.apple.com",
  ".push.services.mozilla.com",
];

export const MAX_ENDPOINT_LENGTH = 1024;

export function isPushServiceEndpoint(raw: unknown): boolean {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_ENDPOINT_LENGTH) {
    return false;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;
  /* https://fcm.googleapis.com@attacker.example/ parses with hostname
     attacker.example and "fcm.googleapis.com" as the username. The host check
     below already refuses it, but a real endpoint never carries credentials,
     so their presence alone is disqualifying. */
  if (url.username || url.password) return false;
  /* A real endpoint is on the default port. A non-default one is either not a
     push service or an attempt to reach a different service on the same host. */
  if (url.port !== "" && url.port !== "443") return false;

  const host = url.hostname.toLowerCase();
  if (EXACT_HOSTS.has(host)) return true;
  return HOST_SUFFIXES.some((suffix) => host.endsWith(suffix) && host.length > suffix.length);
}
