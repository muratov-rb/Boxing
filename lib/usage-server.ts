import "server-only";
import { createAdminClient, serviceRoleConfigured } from "./supabase/admin";
import type { Caller } from "./entitlements-server";

/* ===========================================================================
   Spending a daily quota, decided on the server.

   The browser still keeps its own counters so the UI can show "2 of 3 left"
   without a round trip, but those are a display cache. This is the number that
   decides whether an expensive call actually happens.
   =========================================================================== */

export type QuotaKey = "calorieScan" | "nutritionPlan" | "coachAnalysis";

export interface QuotaVerdict {
  allowed: boolean;
  used: number;
  limit: number;
  /** True when the plan has no access at all, as opposed to running out. */
  locked: boolean;
}

function limitFor(caller: Caller, key: QuotaKey): number {
  const e = caller.entitlements;
  if (key === "calorieScan") return e.calorieScansPerDay;
  if (key === "coachAnalysis") return e.coachAnalysesPerDay;
  return e.nutritionPlansPerDay;
}

const ALL_KEYS: QuotaKey[] = ["calorieScan", "nutritionPlan", "coachAnalysis"];

/** Read today's counters without spending anything — for showing "2 of 3 left"
    honestly, including on a second device where localStorage knows nothing. */
export async function readQuotas(
  caller: Caller,
  today = new Date().toISOString().slice(0, 10),
): Promise<Record<QuotaKey, QuotaVerdict>> {
  const blank = (key: QuotaKey): QuotaVerdict => {
    const limit = limitFor(caller, key);
    return { allowed: limit > 0, used: 0, limit, locked: limit <= 0 };
  };
  /* Built from ALL_KEYS rather than listed by hand, so adding a quota cannot
     leave a gap here that shows as an undefined counter in the UI. */
  const allBlank = () =>
    Object.fromEntries(ALL_KEYS.map((k) => [k, blank(k)])) as Record<QuotaKey, QuotaVerdict>;

  if (!serviceRoleConfigured()) return allBlank();

  try {
    const { data } = await createAdminClient()
      .from("user_activity")
      .select("usage")
      .eq("user_id", caller.userId)
      .eq("day", today)
      .maybeSingle<{ usage: Record<string, number> }>();

    const out = {} as Record<QuotaKey, QuotaVerdict>;
    for (const key of ALL_KEYS) {
      const limit = limitFor(caller, key);
      const used = data?.usage?.[key] ?? 0;
      out[key] = { allowed: used < limit, used, limit, locked: limit <= 0 };
    }
    return out;
  } catch {
    return allBlank();
  }
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
