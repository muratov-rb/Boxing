/* Where "?next=" is allowed to send someone.

   Login, registration and email confirmation all carry a `next` so a person
   who was heading for /plans lands on /plans rather than the dashboard. That
   value came from the query string and was used unchecked, which made it an
   open redirect in two different ways:

     window.location.assign(next)   — with next=https://evil.com, straight there
     redirect(`${origin}${next}`)   — with next=@evil.com, "https://site@evil.com"
                                      puts our domain in the userinfo and the
                                      attacker's in the host; with next=.evil.com
                                      it becomes ringbornn.com.evil.com, which
                                      they can register and which reads as ours

   A post-login redirect is the valuable kind to steal: the victim reaches a
   real login page on the real domain, types real credentials, and only then
   gets handed to whoever wrote the link.

   Rather than blocklist the tricks -- there are always more -- resolve the
   value against a throwaway origin and insist it stayed there. Anything that
   changes origin is not a path on this site, whatever shape it arrived in.
   Control characters need no separate check: the URL parser percent-encodes
   them, so a newline cannot survive into a header or a location. */

const BASE = "https://ringbornn.invalid";

export const DEFAULT_NEXT = "/dashboard";

/**
 * The path this `next` may go to, or the fallback.
 *
 * Always returns a same-origin path beginning with "/", so it is safe both
 * for `location.assign()` and for concatenation after an origin.
 */
export function safeNext(raw: unknown, fallback: string = DEFAULT_NEXT): string {
  if (typeof raw !== "string" || raw === "") return fallback;

  try {
    const url = new URL(raw, BASE);
    /* "//evil.com" and "https://evil.com" both land on another origin here.
       "@evil.com" and ".evil.com" resolve as ordinary relative paths, so they
       come back as "/@evil.com" and "/.evil.com" -- harmless, because they are
       now unambiguously paths rather than hosts. */
    if (url.origin !== BASE) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (!path.startsWith("/")) return fallback;

    /* Staying on the base origin is necessary but not sufficient, which a
       fuzzer caught and the hand-written cases did not: "..\\" and ".//"
       resolve to a pathname that itself begins with "//". That passes the
       origin check above and then means something entirely different at the
       sink, where "//evil.com" is protocol-relative and leaves the site.

       So the result must also be a single-slash path. */
    if (path.startsWith("//") || path.startsWith("/\\")) return fallback;
    return path;
  } catch {
    return fallback;
  }
}
