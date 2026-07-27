/* ===========================================================================
   RINGBORNN — admin panel arithmetic.

   Kept out of the component so the money can be checked directly: this is
   where a yearly plan gets spread across twelve months, and where a banned
   account stops counting towards revenue.
   =========================================================================== */

import { PRICES, PRICES_YEARLY, type PaidPlanId } from "./subscription";

export interface UserRow {
  user_id: string;
  email: string | null;
  plan: string;
  period: string | null;
  trial_start: string;
  banned: boolean;
  banned_at: string | null;
  updated_at: string;
  last_active: string | null;
}

export const isPaid = (plan: string): plan is PaidPlanId =>
  plan === "budget" || plan === "pro" || plan === "max";

/** What one row contributes per month; yearly plans are spread over twelve. */
export function monthlyValue(r: UserRow): number {
  if (!isPaid(r.plan) || r.banned) return 0;
  return r.period === "yearly" ? PRICES_YEARLY[r.plan] / 12 : PRICES[r.plan];
}

export interface AdminStats {
  total: number;
  trial: number;
  budget: number;
  pro: number;
  max: number;
  expired: number;
  banned: number;
  paying: number;
  yearly: number;
  monthly: number;
  active30: number;
  mrr: number;
  arr: number;
}

/** `now` is injectable so the 30-day window can be tested at a fixed date. */
export function summarise(rows: UserRow[], now = Date.now()): AdminStats {
  const live = rows.filter((r) => !r.banned);
  const by = (p: string) => live.filter((r) => r.plan === p).length;
  const paid = live.filter((r) => isPaid(r.plan));
  const yearly = paid.filter((r) => r.period === "yearly").length;
  const mrr = rows.reduce((s, r) => s + monthlyValue(r), 0);

  return {
    total: rows.length,
    trial: by("trial"),
    budget: by("budget"),
    pro: by("pro"),
    max: by("max"),
    expired: by("expired"),
    banned: rows.length - live.length,
    paying: paid.length,
    yearly,
    monthly: paid.length - yearly,
    active30: rows.filter(
      (r) =>
        r.last_active &&
        now - new Date(`${r.last_active}T00:00:00`).getTime() < 30 * 86_400_000,
    ).length,
    mrr,
    arr: mrr * 12,
  };
}

/** Monthly-equivalent revenue per paid tier, for the revenue chart. */
export function revenueByTier(rows: UserRow[]): Record<PaidPlanId, number> {
  const out: Record<PaidPlanId, number> = { budget: 0, pro: 0, max: 0 };
  for (const r of rows) if (isPaid(r.plan)) out[r.plan] += monthlyValue(r);
  return out;
}

/** Sign-ups per calendar month (trial start), oldest first, last `months`. */
export function signupsByMonth(
  rows: UserRow[],
  months = 6,
): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const m = (r.trial_start ?? "").slice(0, 7);
    if (m) counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-months)
    .map(([label, value]) => ({ label, value }));
}

/** One CSV row per user, header included. Commas in emails are quoted. */
export function toCsv(rows: UserRow[]): string {
  const cell = (v: string) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v);
  const head = "email,plan,period,banned,trial_start,last_active,updated_at";
  const body = rows
    .map((r) =>
      [
        r.email ?? "",
        r.plan,
        r.period ?? "monthly",
        r.banned ? "yes" : "no",
        r.trial_start,
        r.last_active ?? "",
        r.updated_at,
      ]
        .map(cell)
        .join(","),
    )
    .join("\n");
  return `${head}\n${body}`;
}
