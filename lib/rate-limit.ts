import "server-only";

/* ===========================================================================
   A small in-memory throttle for the admin login.

   The admin password is the only thing standing between the internet and a
   panel that can delete every user's training history, so an unlimited guess
   rate is not acceptable — even against a long random password.

   Deliberately in-memory: it needs no extra infrastructure and it fails safe.
   The honest limitation is that serverless instances don't share state, so an
   attacker spread across many cold instances gets more attempts than the
   numbers below suggest. It still turns "guess forever" into "guess slowly",
   which is the difference that matters. Move this to the database or a KV
   store if the panel ever becomes a real target.
   =========================================================================== */

const WINDOW_MS = 15 * 60 * 1000; // failures are forgotten after 15 minutes
const MAX_FAILURES = 8; // then the source is locked out
const LOCKOUT_MS = 15 * 60 * 1000;

interface Attempts {
  failures: number;
  first: number;
  lockedUntil: number;
}

const buckets = new Map<string, Attempts>();

/** Keep the map from growing without bound on a long-lived instance. */
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [key, a] of buckets) {
    if (now > a.lockedUntil && now - a.first > WINDOW_MS) buckets.delete(key);
  }
}

/** Best-effort client identity. Spoofable, which is why the lockout is short
    and the password still has to be strong — this raises cost, not a wall. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

export interface RateVerdict {
  allowed: boolean;
  /** Seconds until the caller may try again, when blocked. */
  retryAfter: number;
  /** Guesses left before a lockout, for the caller's own logging. */
  remaining: number;
}

export function checkRate(key: string, now = Date.now()): RateVerdict {
  sweep(now);
  const a = buckets.get(key);
  if (!a) return { allowed: true, retryAfter: 0, remaining: MAX_FAILURES };

  if (now < a.lockedUntil) {
    return {
      allowed: false,
      retryAfter: Math.ceil((a.lockedUntil - now) / 1000),
      remaining: 0,
    };
  }
  if (now - a.first > WINDOW_MS) {
    buckets.delete(key); // window expired, clean slate
    return { allowed: true, retryAfter: 0, remaining: MAX_FAILURES };
  }
  return {
    allowed: true,
    retryAfter: 0,
    remaining: Math.max(0, MAX_FAILURES - a.failures),
  };
}

export function recordFailure(key: string, now = Date.now()): void {
  const a = buckets.get(key);
  if (!a || now - a.first > WINDOW_MS) {
    buckets.set(key, { failures: 1, first: now, lockedUntil: 0 });
    return;
  }
  a.failures += 1;
  if (a.failures >= MAX_FAILURES) a.lockedUntil = now + LOCKOUT_MS;
}

/** A correct password clears the record — a legitimate admin who fat-fingers
    their password a few times shouldn't stay one mistake from a lockout. */
export function recordSuccess(key: string): void {
  buckets.delete(key);
}
