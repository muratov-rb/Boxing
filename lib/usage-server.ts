import "server-only";
import { createAdminClient, serviceRoleConfigured } from "./supabase/admin";
import type { Caller } from "./entitlements-server";

/* ===========================================================================
   Spending a daily quota, decided on the server.

   The browser still keeps its own counters so the UI can show "2 of 3 left"
   without a round trip, but those are a display cache. This is the number that
   decides whether an expensive call actually happens.
   =========================================================================== */

export type QuotaKey = "calorieScan" | "techniqueVideo";

export interface QuotaVerdict {
  allowed: boolean;
  used: number;
  limit: number;
  /** True when the plan has no access at all, as opposed to running out. */
  locked: boolean;
}

function limitFor(caller: Caller, key: QuotaKey): number {
  return key === "calorieScan"
    ? caller.entitlements.calorieScansPerDay
    : caller.entitlements.techniqueVideosPerDay;
}

/**
 * Try to spend one unit of today's quota.
 *
 * Fails CLOSED when the limit is reached — the whole point is to stop the
 * call — but fails OPEN if the database itself is unreachable, so a Supabase
 * outage degrades into "everyone gets their features" rather than "nobody
 * does". Losing a few dollars of API spend beats taking the product down.
 */
export async function spendQuota(
  caller: Caller,
  key: QuotaKey,
  today = new Date().toISOString().slice(0, 10),
): Promise<QuotaVerdict> {
  const limit = limitFor(caller, key);
  if (limit <= 0) return { allowed: false, used: 0, limit, locked: true };

  if (!serviceRoleConfigured()) {
    // no way to count; don't punish the user for our missing configuration
    return { allowed: true, used: 0, limit, locked: false };
  }

  try {
    const { data, error } = await createAdminClient().rpc("consume_usage", {
      p_user: caller.userId,
      p_day: today,
      p_key: key,
      p_limit: limit,
    });
    if (error) throw error;

    const count = typeof data === "number" ? data : -1;
    if (count < 0) return { allowed: false, used: limit, limit, locked: false };
    return { allowed: true, used: count, limit, locked: false };
  } catch {
    return { allowed: true, used: 0, limit, locked: false };
  }
}
