import "server-only";
import { createAdminClient, serviceRoleConfigured } from "./supabase/admin";
import { generateSecret, otpauthUri, verifyCode } from "./totp";

/* ===========================================================================
   Storing and checking the admin second factor.

   Enrolment is two steps on purpose. Starting it writes a secret but leaves
   confirmed_at null, and an unconfirmed secret is never enforced — so someone
   who opens the setup screen and wanders off has not locked themselves out of
   their own panel. It only becomes required once they have typed a code back
   and proved the authenticator really has it.
   =========================================================================== */

const TABLE = "admin_totp";

export interface TotpState {
  enrolled: boolean;
  startedAt: string | null;
}

interface Row {
  username: string;
  secret: string;
  confirmed_at: string | null;
  last_step: number | null;
}

/** Thrown when we cannot find out whether 2FA is on. Callers must treat this
    as "refuse", never as "not enrolled". */
export class TotpUnavailable extends Error {}

async function read(username: string): Promise<Row | null> {
  const { data, error } = await createAdminClient()
    .from(TABLE)
    .select("username, secret, confirmed_at, last_step")
    .eq("username", username)
    .maybeSingle<Row>();
  if (error) throw new TotpUnavailable(error.message);
  return data ?? null;
}

/**
 * Whether this admin must present a code. Unconfirmed secrets don't count.
 *
 * Fails CLOSED. An earlier version swallowed query errors and returned false,
 * which meant anyone able to stall Supabase could skip the second factor
 * entirely. If we cannot read the table we refuse the login instead — the
 * panel is useless without that database anyway, so nothing is lost.
 *
 * The one exception is a deployment with no service-role key at all: 2FA
 * cannot have been enrolled there, and the panel already refuses to load.
 */
export async function totpRequired(username: string): Promise<boolean> {
  if (!serviceRoleConfigured()) return false;
  const row = await read(username); // throws TotpUnavailable on failure
  return !!row?.confirmed_at;
}

/** For display only, so an unreadable table simply shows "off". */
export async function totpState(username: string): Promise<TotpState> {
  try {
    const row = await read(username);
    return { enrolled: !!row?.confirmed_at, startedAt: null };
  } catch {
    return { enrolled: false, startedAt: null };
  }
}

/** Begin enrolment: a fresh secret, replacing any half-finished attempt. */
export async function startEnrolment(
  username: string,
): Promise<{ secret: string; uri: string } | null> {
  if (!serviceRoleConfigured()) return null;
  const secret = generateSecret();
  try {
    await createAdminClient()
      .from(TABLE)
      .upsert(
        { username, secret, confirmed_at: null, last_step: null, created_at: new Date().toISOString() },
        { onConflict: "username" },
      );
    return { secret, uri: otpauthUri(secret, username) };
  } catch {
    return null;
  }
}

/** Finish enrolment by proving the authenticator holds the secret. */
export async function confirmEnrolment(username: string, code: string): Promise<boolean> {
  let row: Row | null;
  try {
    row = await read(username);
  } catch {
    return false; // cannot verify, so cannot confirm
  }
  if (!row || row.confirmed_at) return false;
  if (!verifyCode(row.secret, code)) return false;
  try {
    await createAdminClient()
      .from(TABLE)
      .update({ confirmed_at: new Date().toISOString(), last_used_at: new Date().toISOString() })
      .eq("username", username);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check a code at login.
 *
 * A used step is recorded and refused a second time: without that, a code
 * glimpsed over someone's shoulder stays valid for the rest of its 30-second
 * window. Fails CLOSED — if the second factor cannot be checked, the login
 * does not proceed.
 */
export async function checkLoginCode(username: string, code: string): Promise<boolean> {
  let row: Row | null;
  try {
    row = await read(username);
  } catch {
    return false; // unreadable table means the code cannot be trusted
  }
  if (!row?.confirmed_at) return false;
  if (!verifyCode(row.secret, code)) return false;

  const step = Math.floor(Date.now() / 1000 / 30);
  if (row.last_step !== null && step <= row.last_step) return false;

  try {
    await createAdminClient()
      .from(TABLE)
      .update({ last_step: step, last_used_at: new Date().toISOString() })
      .eq("username", username);
  } catch {
    /* the code was valid; failing to record it must not block the login */
  }
  return true;
}

/** Turn it off. Requires a working code, so a hijacked session can't do it. */
export async function disableTotp(username: string, code: string): Promise<boolean> {
  let row: Row | null;
  try {
    row = await read(username);
  } catch {
    return false;
  }
  if (!row?.confirmed_at || !verifyCode(row.secret, code)) return false;
  try {
    await createAdminClient().from(TABLE).delete().eq("username", username);
    return true;
  } catch {
    return false;
  }
}
