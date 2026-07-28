import "server-only";
import { createAdminClient, serviceRoleConfigured } from "./supabase/admin";

/* ===========================================================================
   Brute-force throttle for the admin login.

   The admin password is the only thing between the internet and a panel that
   can delete every user's training history, so an unlimited guess rate is not
   acceptable even against a long random password.

   State lives in Postgres, not in memory. An in-process Map looks like it
   works in development and then does nothing in production: Vercel spreads
   requests across serverless instances that share no memory, so each guess can
   land on a fresh counter. That was measured, not assumed — nine consecutive
   failures against the deployed site never tripped a memory-backed limit.

   The in-memory path below is kept only as a fallback for when the service-role
   key is absent (the panel cannot work at all in that state, so the login is
   moot) and for local development.
   =========================================================================== */

const WINDOW_MS = 15 * 60 * 1000; // failures are forgotten after 15 minutes
const MAX_FAILURES = 8; // then the source is locked out
const LOCKOUT_MS = 15 * 60 * 1000;
const TABLE = "admin_login_attempts";

export interface RateVerdict {
  allowed: boolean;
  /** Seconds until the caller may try again, when blocked. */
  retryAfter: number;
}

const ALLOW: RateVerdict = { allowed: true, retryAfter: 0 };

/** Best-effort client identity. Spoofable, which is why the lockout is short
    and the password still has to be strong — this raises cost, not a wall. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
  return ip.slice(0, 100) || "unknown";
}

/* ------------------------------ memory fallback -------------------------- */

interface Attempts {
  failures: number;
  first: number;
  lockedUntil: number;
}
const buckets = new Map<string, Attempts>();

function memCheck(key: string, now: number): RateVerdict {
  const a = buckets.get(key);
  if (!a) return ALLOW;
  if (now < a.lockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((a.lockedUntil - now) / 1000) };
  }
  if (now - a.first > WINDOW_MS) buckets.delete(key);
  return ALLOW;
}

function memFail(key: string, now: number): void {
  if (buckets.size > 500) {
    for (const [k, a] of buckets) {
      if (now > a.lockedUntil && now - a.first > WINDOW_MS) buckets.delete(k);
    }
  }
  const a = buckets.get(key);
  if (!a || now - a.first > WINDOW_MS) {
    buckets.set(key, { failures: 1, first: now, lockedUntil: 0 });
    return;
  }
  a.failures += 1;
  if (a.failures >= MAX_FAILURES) a.lockedUntil = now + LOCKOUT_MS;
}

/* -------------------------------- database ------------------------------- */

interface AttemptRow {
  failures: number;
  first_at: string;
  locked_until: string | null;
}

/** Blocked callers are told to wait; any database trouble fails OPEN, so a
    Supabase outage locks nobody out of their own admin panel. */
export async function checkRate(key: string, now = Date.now()): Promise<RateVerdict> {
  if (!serviceRoleConfigured()) return memCheck(key, now);

  try {
    const { data, error } = await createAdminClient()
      .from(TABLE)
      .select("failures, first_at, locked_until")
      .eq("client_key", key)
      .maybeSingle<AttemptRow>();
    if (error || !data) return ALLOW;

    const lockedUntil = data.locked_until ? Date.parse(data.locked_until) : 0;
    if (lockedUntil > now) {
      return { allowed: false, retryAfter: Math.ceil((lockedUntil - now) / 1000) };
    }
    return ALLOW;
  } catch {
    return ALLOW;
  }
}

export async function recordFailure(key: string, now = Date.now()): Promise<void> {
  if (!serviceRoleConfigured()) return memFail(key, now);

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from(TABLE)
      .select("failures, first_at, locked_until")
      .eq("client_key", key)
      .maybeSingle<AttemptRow>();

    const stale = !data || now - Date.parse(data.first_at) > WINDOW_MS;
    const failures = stale ? 1 : data.failures + 1;

    await supabase.from(TABLE).upsert(
      {
        client_key: key,
        failures,
        first_at: new Date(stale ? now : Date.parse(data.first_at)).toISOString(),
        locked_until:
          failures >= MAX_FAILURES ? new Date(now + LOCKOUT_MS).toISOString() : null,
      },
      { onConflict: "client_key" },
    );
  } catch {
    /* throttling must never break a legitimate login */
  }
}

/** A correct password clears the record — an admin who fat-fingers their
    password a few times shouldn't stay one mistake away from a lockout. */
export async function recordSuccess(key: string): Promise<void> {
  buckets.delete(key);
  if (!serviceRoleConfigured()) return;
  try {
    await createAdminClient().from(TABLE).delete().eq("client_key", key);
  } catch {
    /* best effort */
  }
}
