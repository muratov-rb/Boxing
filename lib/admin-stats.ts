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

/* ===========================================================================
   Trial → paid conversion.

   The stat that decides whether there is a business: of the trials that have
   actually finished, how many ended in a payment. Trials still running are
   excluded from both halves -- counting someone on day 2 as "not converted"
   drags the number down for no reason and makes a healthy product look broken.
   =========================================================================== */

export interface TrialConversion {
  /** Finished trials, excluding banned accounts. */
  ended: number;
  converted: number;
  /** Whole percent, or null when no trial has finished yet. */
  pct: number | null;
  /** Still inside their 7 days — shown separately, never in the maths. */
  running: number;
}

export function trialConversion(
  rows: UserRow[],
  trialDays: number,
  now = Date.now(),
): TrialConversion {
  const dayMs = 86_400_000;
  let ended = 0;
  let converted = 0;
  let running = 0;

  for (const r of rows) {
    if (r.banned) continue;
    if (!r.trial_start) continue;

    const started = Date.parse(`${r.trial_start}T00:00:00Z`);
    if (!Number.isFinite(started)) continue;

    const daysElapsed = Math.floor((now - started) / dayMs);

    /* A paid account counts as converted whether or not its trial clock has
       run out -- someone who upgrades on day 3 converted. */
    if (isPaid(r.plan)) {
      ended++;
      converted++;
      continue;
    }
    if (daysElapsed < trialDays) running++;
    else ended++;
  }

  return {
    ended,
    converted,
    pct: ended === 0 ? null : Math.round((converted / ended) * 100),
    running,
  };
}

/* ===========================================================================
   Cohort retention.

   Each row is the week somebody signed up; each column is how many of that
   group were still training N weeks later. Blended totals hide this: a product
   can look healthy overall while every new cohort collapses in week two,
   because the older users mask it.
   =========================================================================== */

export interface CohortRow {
  /** Monday of the signup week, ISO date. */
  week: string;
  size: number;
  /** weeks[0] is always 100 (the signup week); null = that week has not
      happened yet, which is different from "nobody came back". */
  weeks: (number | null)[];
}

/** Monday of the week containing `iso`, as an ISO date. */
export function weekStart(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

export function cohortRetention(
  signups: { user_id: string; signup: string }[],
  /** One entry per (user, day) the user actually trained. */
  trained: { user_id: string; day: string }[],
  weeksTracked = 4,
  now = Date.now(),
): CohortRow[] {
  const weekMs = 7 * 86_400_000;

  const byUser = new Map<string, string[]>();
  for (const t of trained) {
    const list = byUser.get(t.user_id);
    if (list) list.push(t.day);
    else byUser.set(t.user_id, [t.day]);
  }

  const cohorts = new Map<string, { user_id: string; signup: string }[]>();
  for (const s of signups) {
    if (!s.signup) continue;
    const w = weekStart(s.signup);
    const list = cohorts.get(w);
    if (list) list.push(s);
    else cohorts.set(w, [s]);
  }

  const out: CohortRow[] = [];
  for (const [week, members] of cohorts) {
    const cohortStart = Date.parse(`${week}T00:00:00Z`);
    const weeks: (number | null)[] = [];

    for (let n = 0; n < weeksTracked; n++) {
      const from = cohortStart + n * weekMs;
      const to = from + weekMs;

      /* A week that has not finished yet is unknowable, not zero. Reporting 0%
         for the current week would make every latest cohort look dead. */
      if (to > now) {
        weeks.push(null);
        continue;
      }

      const active = members.filter((m) =>
        (byUser.get(m.user_id) ?? []).some((day) => {
          const t = Date.parse(`${day}T00:00:00Z`);
          return t >= from && t < to;
        }),
      ).length;

      weeks.push(Math.round((active / members.length) * 100));
    }

    out.push({ week, size: members.length, weeks });
  }

  // newest cohort first — that is the one you are watching
  return out.sort((a, b) => (a.week < b.week ? 1 : -1));
}
