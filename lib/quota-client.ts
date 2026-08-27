import { dailyLimit, type LimitState } from "./tracking";

/* ===========================================================================
   What the UI should show for "2 of 3 scans left".

   The local counter is wrong in both directions: on a second device it shows a
   full allowance the server will refuse, and a cleared browser looks like a
   fresh day. Ask the server, and keep the local figure only as the offline and
   signed-out fallback — better a slightly stale number than a spinner.
   =========================================================================== */

export type QuotaKey = "calorieScan" | "techniqueVideo" | "coachAsk";

interface ServerQuota {
  used: number;
  limit: number;
  locked: boolean;
}

export async function fetchLimit(key: QuotaKey): Promise<LimitState> {
  try {
    const res = await fetch("/api/usage");
    if (!res.ok) return dailyLimit(key);
    const data = (await res.json()) as { quotas?: Record<string, ServerQuota> };
    const q = data.quotas?.[key];
    if (!q) return dailyLimit(key);
    return { ok: q.used < q.limit, used: q.used, limit: q.limit, locked: q.locked };
  } catch {
    return dailyLimit(key);
  }
}
