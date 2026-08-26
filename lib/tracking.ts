/* ===========================================================================
   PRESSURE — local tracking: streaks, meals/calories, saved profile.
   Stored per-browser in localStorage for now; the shapes are flat JSON so a
   later pass can sync them to Supabase without reworking the UI.
   =========================================================================== */

import { RANKS, type Profile } from "./onboarding";
import {
  XP_AWARDS,
  XP_DECAY_PER_DAY,
  XP_GRACE_DAYS,
  DAILY_XP_CAP,
  RANK_XP,
  rankFromXp,
} from "./xp";

/* Re-exported so existing call sites keep working; lib/xp.ts is the source. */
export { RANK_XP, rankFromXp };
import { GLASS_ML, WATER_MAX_ML, type Micros } from "./nutrients";
import { DEFAULT_REMINDERS, migrateSettings, type ReminderSettings } from "./reminders";
import {
  entitlementsFor,
  TRIAL_DAYS,
  type Entitlements,
  type PlanId,
  type PaidPlanId,
  type BillingPeriod,
} from "./subscription";

const K_PROFILE = "pressure.profile";
const K_STREAK = "pressure.streak"; // string[] of training days "YYYY-MM-DD"
const K_MEALS = "pressure.meals"; // Record<date, Meal[]>
const K_VISITS = "pressure.visits"; // string[] of usage days "YYYY-MM-DD"
const K_XP = "pressure.xp"; // XpState
const K_RANK_SEEN = "pressure.rankSeen"; // last rank index the user celebrated
const K_SUB = "pressure.sub"; // SubState
const K_USAGE = "pressure.usage"; // Record<date, Record<UsageKey, number>>
const K_BURN = "pressure.burn"; // Record<date, number> — kcal burned training
const K_WATER = "pressure.water"; // Record<date, number> — millilitres drunk
const K_REMINDERS = "pressure.reminders"; // ReminderSettings — device-local

export interface Meal {
  id: string;
  name: string;
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  /* Only ever present on scanned meals, and even then only when the model was
     willing to estimate. Optional all the way down so a hand-typed meal is not
     silently counted as containing zero of everything. */
  micros?: Micros;
  at: string; // ISO time
  source: "manual" | "scan";
}

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/* Anything that changes local state notifies listeners, so the Supabase sync
   layer can push it without every call site having to know about the server. */
type ChangeListener = (key: string) => void;
const listeners = new Set<ChangeListener>();

export function onTrackingChange(fn: ChangeListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function write(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full/blocked — tracking is best-effort */
  }
  for (const fn of listeners) {
    try {
      fn(key);
    } catch {
      /* a broken listener must never break tracking */
    }
  }
}

/** Replace local state wholesale — used by the sync layer after a server pull.
    Deliberately silent: it must not echo back as a change and cause a push. */
export function hydrateLocal(entries: Record<string, unknown>): void {
  if (!isBrowser()) return;
  for (const [key, value] of Object.entries(entries)) {
    try {
      if (value === undefined) continue;
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }
}

/** Storage keys, exported so the sync layer maps slices without guessing. */
export const KEYS = {
  profile: K_PROFILE,
  streak: K_STREAK,
  meals: K_MEALS,
  visits: K_VISITS,
  xp: K_XP,
  rankSeen: K_RANK_SEEN,
  sub: K_SUB,
  usage: K_USAGE,
  burn: K_BURN,
  water: K_WATER,
  /* Listed so wipeLocal clears it, but deliberately absent from the sync
     layer's push: a schedule that suits a phone is wrong for a laptop. */
  reminders: K_REMINDERS,
} as const;

/** Raw slice reads for the sync layer (typed accessors live further down). */
export function readSlice<T>(key: string, fallback: T): T {
  return read<T>(key, fallback);
}

/** Erase every local slice. Used when the account has been banned and its
    server data wiped — leaving the copy here would only push it back up.
    Silent for the same reason hydrateLocal is. */
export function wipeLocal(): void {
  if (!isBrowser()) return;
  for (const key of Object.values(KEYS)) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ------------------------------- profile -------------------------------- */
export function saveProfile(p: Profile) {
  write(K_PROFILE, p);
}

export function loadProfile(): Profile | null {
  return read<Profile | null>(K_PROFILE, null);
}

/* ------------------------------- streaks -------------------------------- */
export function markTrainedToday(): string[] {
  const days = new Set(read<string[]>(K_STREAK, []));
  days.add(todayKey());
  const list = [...days].sort();
  write(K_STREAK, list);
  return list;
}

export function trainedToday(): boolean {
  return read<string[]>(K_STREAK, []).includes(todayKey());
}

/** consecutive days ending today (or yesterday, so a streak isn't "lost"
    before today's session is done) */
export function currentStreak(): number {
  const days = new Set(read<string[]>(K_STREAK, []));
  if (days.size === 0) return 0;

  const d = new Date();
  // streak may be anchored on yesterday if today isn't logged yet
  if (!days.has(todayKey(d))) d.setDate(d.getDate() - 1);

  let n = 0;
  while (days.has(todayKey(d))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function totalTrainedDays(): number {
  return read<string[]>(K_STREAK, []).length;
}

/* ------------------------- usage streak (Duolingo) ----------------------- */
/* The headline streak: consecutive calendar days the user opened the app.
   Call registerVisit() once when the app loads. */

function countConsecutive(days: Set<string>): number {
  if (days.size === 0) return 0;
  const d = new Date();
  if (!days.has(todayKey(d))) d.setDate(d.getDate() - 1); // today may be pending
  let n = 0;
  while (days.has(todayKey(d))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Records today's visit (idempotent) and settles XP decay. Returns the
    live usage streak. Safe to call on every app load. */
export function registerVisit(): number {
  const today = todayKey();
  const visits = new Set(read<string[]>(K_VISITS, []));
  const firstToday = !visits.has(today);
  visits.add(today);
  write(K_VISITS, [...visits].sort());

  // settle XP to today; award a small daily-use bonus the first time each day
  const state = readXp();
  const settled = settleXp(state, today);
  writeXp({ xp: settled.xp + (firstToday ? XP.visit : 0), lastActive: today });

  return countConsecutive(visits);
}

export function usageStreak(): number {
  return countConsecutive(new Set(read<string[]>(K_VISITS, [])));
}

export function bestUsageStreak(): number {
  const days = [...new Set(read<string[]>(K_VISITS, []))].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of days) {
    if (prev && dayGap(prev, day) === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

export function totalUsageDays(): number {
  return new Set(read<string[]>(K_VISITS, [])).size;
}

/** Streak milestones — the numbers that unlock a bigger celebration.
    100 / 150 / 250+ get the special "epic" treatment. */
export const STREAK_MILESTONES = [7, 14, 30, 50, 75, 100, 150, 250, 365, 500];

export function milestoneFor(streak: number): number | null {
  return STREAK_MILESTONES.includes(streak) ? streak : null;
}
export function isEpicMilestone(streak: number): boolean {
  return streak >= 100 && STREAK_MILESTONES.includes(streak);
}

/* ------------------------------ XP & ranks ------------------------------- */
/* Rank is earned, not fixed: XP rises with training and daily use, and
   decays when the user goes quiet — so a rank can climb or slip. */

interface XpState {
  xp: number;
  lastActive: string; // YYYY-MM-DD
  day?: string; // day the daily-cap counter belongs to
  dayXp?: number; // XP already earned that day
}

/* The XP economy now lives in lib/xp.ts and is applied by the server. What
   follows is the local mirror: it keeps the dashboard responsive and keeps
   working offline, but /api/progress/award has the final say and its answer
   overwrites whatever is here. Mastery is measured in years — at the daily cap
   the top rank is ~2.5 years of perfect attendance. */
const XP = XP_AWARDS;
const DECAY_PER_DAY = XP_DECAY_PER_DAY;
const GRACE_DAYS = XP_GRACE_DAYS;

function dayGap(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`).getTime();
  const db = new Date(`${b}T00:00:00`).getTime();
  return Math.round((db - da) / 86_400_000);
}

function readXp(): XpState {
  return read<XpState>(K_XP, { xp: 0, lastActive: todayKey() });
}
function writeXp(s: XpState) {
  write(K_XP, s);
}

/** Apply idle decay up to `today` without banking it. */
function settleXp(state: XpState, today: string): XpState {
  const gap = dayGap(state.lastActive, today);
  if (gap <= GRACE_DAYS) return state;
  const decayed = Math.max(0, Math.round(state.xp - (gap - GRACE_DAYS) * DECAY_PER_DAY));
  return { ...state, xp: decayed, lastActive: today };
}

/**
 * Award XP for an action.
 *
 * Updates the local mirror immediately so the rank bar moves the instant you
 * finish something, then asks the server for the real number and corrects to
 * it. The optimistic figure is only ever a guess at what the server will say —
 * if the two disagree, the server wins, which is the entire point.
 *
 * Signed-out or offline, the local value stands and syncs later.
 */
export function awardXp(kind: keyof typeof XP): number {
  const today = todayKey();
  const settled = settleXp(readXp(), today);
  const dayXp = settled.day === today ? (settled.dayXp ?? 0) : 0;
  const grant = Math.max(0, Math.min(XP[kind], DAILY_XP_CAP - dayXp));
  const xp = settled.xp + grant;
  writeXp({ xp, lastActive: today, day: today, dayXp: dayXp + grant });

  void confirmWithServer(kind);
  return xp;
}

async function confirmWithServer(kind: keyof typeof XP): Promise<void> {
  if (!isBrowser()) return;
  try {
    const res = await fetch("/api/progress/award", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    if (!res.ok) return; // signed out, offline, or not configured — keep local
    const { xp } = (await res.json()) as { xp?: number };
    if (typeof xp === "number") applyServerXp(xp);
  } catch {
    /* offline — the local mirror is what the user sees until sync catches up */
  }
}

export function currentXp(): number {
  return settleXp(readXp(), todayKey()).xp;
}

/** Overwrite the local mirror with the server's authoritative total. */
export function applyServerXp(xp: number): void {
  const today = todayKey();
  const prev = readXp();
  const dayXp = prev.day === today ? (prev.dayXp ?? 0) : 0;
  writeXp({ xp, lastActive: today, day: today, dayXp });
}

export interface RankProgress {
  xp: number;
  rankIndex: number;
  xpIntoTier: number;
  tierSize: number;
  pctToNext: number; // 0–100
  toNext: number; // XP remaining to the next rank (0 at max)
  atMax: boolean;
}

export function rankProgress(): RankProgress {
  const xp = currentXp();
  const rankIndex = rankFromXp(xp);
  const atMax = rankIndex >= RANK_XP.length - 1;
  const base = RANK_XP[rankIndex];
  const next = atMax ? base : RANK_XP[rankIndex + 1];
  const tierSize = Math.max(1, next - base);
  const xpIntoTier = xp - base;
  return {
    xp,
    rankIndex,
    xpIntoTier,
    tierSize,
    pctToNext: atMax ? 100 : Math.min(100, Math.round((xpIntoTier / tierSize) * 100)),
    toNext: atMax ? 0 : Math.max(0, next - xp),
    atMax,
  };
}

/** Rank-up detection for the celebration: returns the newly reached rank
    index if it's higher than what the user last saw, else null. Also keeps
    the "seen" marker in sync when a rank slips (no celebration on the way
    down). Call once on dashboard load, after registerVisit(). */
export function consumeRankUp(): number | null {
  const current = rankFromXp(currentXp());
  const seen = read<number>(K_RANK_SEEN, 0);
  if (current > seen) {
    write(K_RANK_SEEN, current);
    return current;
  }
  if (current < seen) write(K_RANK_SEEN, current); // slipped — resync quietly
  return null;
}

export function rankName(index: number): string {
  return RANKS[Math.max(0, Math.min(RANKS.length - 1, index))].name;
}

/* ------------------------------ meals/kcal ------------------------------- */
export function mealsToday(): Meal[] {
  const all = read<Record<string, Meal[]>>(K_MEALS, {});
  return all[todayKey()] ?? [];
}

/** Sanity bounds for one logged meal — nobody eats a 50,000 kcal lunch. */
export const MEAL_KCAL_MIN = 1;
export const MEAL_KCAL_MAX = 2500;

export function addMeal(
  name: string,
  kcal: number,
  source: Meal["source"],
  macros?: { protein?: number; carbs?: number; fat?: number; fiber?: number; micros?: Micros },
): Meal[] {
  const all = read<Record<string, Meal[]>>(K_MEALS, {});
  const key = todayKey();
  const g = (v?: number) => (typeof v === "number" && v >= 0 ? Math.round(v) : undefined);

  /* Drop anything non-numeric or absurd rather than storing it: these figures
     come back from a vision model, and one bad parse should not poison a day's
     totals. An omitted nutrient stays omitted — it is not the same as zero. */
  const cleanMicros = (m?: Micros): Micros | undefined => {
    if (!m) return undefined;
    const out: Micros = {};
    for (const [k, v] of Object.entries(m)) {
      if (typeof v === "number" && v > 0 && v < 100000) out[k as keyof Micros] = Math.round(v);
    }
    return Object.keys(out).length > 0 ? out : undefined;
  };

  const meal: Meal = {
    id: Math.random().toString(36).slice(2, 10),
    name: name.trim().slice(0, 60) || "—",
    kcal: Math.min(MEAL_KCAL_MAX, Math.max(MEAL_KCAL_MIN, Math.round(kcal))),
    protein: g(macros?.protein),
    carbs: g(macros?.carbs),
    fat: g(macros?.fat),
    fiber: g(macros?.fiber),
    micros: cleanMicros(macros?.micros),
    at: new Date().toISOString(),
    source,
  };
  all[key] = [...(all[key] ?? []), meal];
  write(K_MEALS, all);
  return all[key];
}

export function removeMeal(id: string): Meal[] {
  const all = read<Record<string, Meal[]>>(K_MEALS, {});
  const key = todayKey();
  all[key] = (all[key] ?? []).filter((m) => m.id !== id);
  write(K_MEALS, all);
  return all[key];
}

/* ------------------------- training burn (kcal) -------------------------- */
/* Finished workouts/lessons log their kcal estimate, and the calorie counter
   credits it back against the day's intake. */

export function addBurned(kcal: number): number {
  const n = Math.max(0, Math.min(3000, Math.round(kcal)));
  if (n === 0) return burnedToday();
  const all = read<Record<string, number>>(K_BURN, {});
  const key = todayKey();
  all[key] = (all[key] ?? 0) + n;
  write(K_BURN, all);
  return all[key];
}

export function burnedToday(): number {
  return read<Record<string, number>>(K_BURN, {})[todayKey()] ?? 0;
}

/* ---------------------------------- water -------------------------------- */
/* Stored in millilitres so the display unit stays a presentation choice —
   litres for most of the world, and a later ounces switch needs no migration
   of anyone's saved history. */

/** Add (or, with a negative amount, undo) a drink. Clamped at zero so a
    mis-tap on undo cannot drive the day negative. */
export function addWater(ml = GLASS_ML): number {
  const all = read<Record<string, number>>(K_WATER, {});
  const key = todayKey();
  const next = Math.max(0, Math.min(WATER_MAX_ML * 2, (all[key] ?? 0) + Math.round(ml)));
  all[key] = next;
  write(K_WATER, all);
  return next;
}

export function waterToday(): number {
  return read<Record<string, number>>(K_WATER, {})[todayKey()] ?? 0;
}

export function resetWaterToday(): number {
  const all = read<Record<string, number>>(K_WATER, {});
  all[todayKey()] = 0;
  write(K_WATER, all);
  return 0;
}

/* -------------------------------- reminders ------------------------------ */

/** Repaired on the way out, so a blob written by an older build — one with a
    flat `meals` array and no slots — is upgraded rather than discarded. */
export function loadReminders(): ReminderSettings {
  const saved = read<Partial<ReminderSettings> | null>(K_REMINDERS, null);
  if (!saved) return DEFAULT_REMINDERS;
  return migrateSettings(saved);
}

export function saveReminders(s: ReminderSettings): ReminderSettings {
  write(K_REMINDERS, s);
  return s;
}

/** Whether this device has ever saved reminder settings. The UI uses it to
    decide if it may replace the built-in English slot names with translated
    ones — it must never overwrite names the user chose themselves. */
export function hasSavedReminders(): boolean {
  return read<unknown>(K_REMINDERS, null) !== null;
}

/** Minutes-of-day for each meal logged today — what the scheduler needs to
    decide whether a slot has already been satisfied. */
export function mealMinutesToday(): number[] {
  return mealsToday()
    .map((m) => {
      const d = new Date(m.at);
      return Number.isNaN(d.getTime()) ? null : d.getHours() * 60 + d.getMinutes();
    })
    .filter((n): n is number => n !== null);
}

/* ---------------------------- calorie target ----------------------------- */
/** Mifflin–St Jeor BMR × moderate training activity, adjusted for the goal. */
export function calorieTarget(p: Profile | null): number {
  if (!p) return 2200;

  const w = Number(p.weight);
  const h = Number(p.height);
  const age = Number(p.age);
  if (!(w > 0) || !(h > 0) || !(age > 0)) return 2200;

  const kg = p.weightUnit === "lb" ? w * 0.4536 : w;
  const cm = p.heightUnit === "ft" ? h * 30.48 : h;

  // sex term: male +5, female −161, unspecified → midpoint
  const sexTerm = p.sex === "male" ? 5 : p.sex === "female" ? -161 : -78;
  const bmr = 10 * kg + 6.25 * cm - 5 * age + sexTerm;

  let target = bmr * 1.55; // training 4–5×/week

  if (p.goals.includes("lose_fat")) target -= 400;
  else if (p.goals.includes("build")) target += 250;

  return Math.max(1200, Math.round(target / 10) * 10);
}

/* ------------------------------ macros ----------------------------------- */
export interface Macros {
  kcal: number;
  protein: number; // grams
  carbs: number;
  fat: number;
}

/** Protein/carbs/fat split from the calorie target + bodyweight + goal.
    Protein scales with lean-mass needs, fat holds ~25–30% of energy, carbs
    fuel the rest — the pattern that suits boxing conditioning. */
export function macroTargets(p: Profile | null): Macros {
  const kcal = calorieTarget(p);
  const kg = p ? (p.weightUnit === "lb" ? Number(p.weight) * 0.4536 : Number(p.weight)) : 0;
  const bw = kg > 0 && kg < 350 ? kg : 75;

  const cutting = !!p?.goals.includes("lose_fat");
  const building = !!(p?.goals.includes("build") || p?.goals.includes("strength"));

  const protein = Math.round((cutting ? 2.2 : building ? 2.0 : 1.8) * bw);
  const fatKcal = kcal * (cutting ? 0.25 : 0.28);
  const fat = Math.round(fatKcal / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));

  return { kcal, protein, carbs, fat };
}

/* --------------------------- subscription/trial -------------------------- */
/* The active plan resolves from a stored choice + the trial clock. A paid
   choice wins; otherwise you're on the trial until it runs out, then expired.
   `trialStart` is stamped the first time the app asks (call ensureTrial on
   load, alongside registerVisit). */

interface SubState {
  plan: PaidPlanId | null; // an explicit paid choice, or null = still on trial
  trialStart: string; // YYYY-MM-DD
  period?: BillingPeriod; // how that plan is billed (defaults to monthly)
}

function readSub(): SubState {
  return read<SubState>(K_SUB, { plan: null, trialStart: todayKey() });
}

/** Stamp the trial start on first run. Safe to call every load. */
export function ensureTrial(): void {
  if (!isBrowser()) return;
  const raw = localStorage.getItem(K_SUB);
  if (!raw) write(K_SUB, { plan: null, trialStart: todayKey() });
}

/** Days left in the free trial (0 once it's over). */
export function trialDaysLeft(): number {
  const s = readSub();
  const used = dayGap(s.trialStart, todayKey());
  return Math.max(0, TRIAL_DAYS - used);
}

/** Which day of the trial we're on, 1-based (1..TRIAL_DAYS, then >TRIAL_DAYS). */
export function trialDay(): number {
  const s = readSub();
  return dayGap(s.trialStart, todayKey()) + 1;
}

/** The effective plan right now. */
export function activePlan(): PlanId {
  const s = readSub();
  if (s.plan) return s.plan;
  return trialDaysLeft() > 0 ? "trial" : "expired";
}

/** Record the user's chosen paid plan (local until real billing lands). */
export function setPlan(plan: PaidPlanId, period: BillingPeriod = "monthly"): void {
  write(K_SUB, { ...readSub(), plan, period });
}

/** How the active plan is billed. */
export function billingPeriod(): BillingPeriod {
  return readSub().period === "yearly" ? "yearly" : "monthly";
}

/** Reset to the trial (used by a "restart trial" dev affordance / downgrade). */
export function clearPlan(): void {
  write(K_SUB, { ...readSub(), plan: null });
}

/** Snapshot for syncing to the server (plan null = still on the trial clock). */
export function exportSubState(): {
  plan: PaidPlanId | null;
  trialStart: string;
  period: BillingPeriod;
} {
  const s = readSub();
  return { plan: s.plan, trialStart: s.trialStart, period: s.period ?? "monthly" };
}

/** Server row wins over local state (admin changes propagate this way).
    Server plan 'trial'/'expired' means "no paid plan — run on the trial clock". */
export function applyServerSub(
  plan: string,
  trialStart: string,
  period?: string | null,
): void {
  const paid: PaidPlanId | null =
    plan === "budget" || plan === "pro" || plan === "max" ? plan : null;
  write(K_SUB, {
    plan: paid,
    trialStart: trialStart || todayKey(),
    period: period === "yearly" ? "yearly" : "monthly",
  });
}

export function entitlements(): Entitlements {
  return entitlementsFor(activePlan());
}

/* ------------------------------ usage meters ----------------------------- */
export type UsageKey = "calorieScan" | "techniqueVideo" | "dailyPlan";

type UsageMap = Record<string, Record<string, number>>;

export function usageToday(key: UsageKey): number {
  const all = read<UsageMap>(K_USAGE, {});
  return all[todayKey()]?.[key] ?? 0;
}

/** Usage over the rolling 7-day window (for weekly limits). */
export function usageThisWeek(key: UsageKey): number {
  const all = read<UsageMap>(K_USAGE, {});
  const today = todayKey();
  let sum = 0;
  for (const [date, m] of Object.entries(all)) {
    const gap = dayGap(date, today);
    if (gap >= 0 && gap < 7) sum += m[key] ?? 0;
  }
  return sum;
}

export function bumpUsage(key: UsageKey): number {
  const all = read<UsageMap>(K_USAGE, {});
  const day = todayKey();
  all[day] = all[day] ?? {};
  all[day][key] = (all[day][key] ?? 0) + 1;
  write(K_USAGE, all);
  return all[day][key];
}

export interface LimitState {
  ok: boolean; // is there quota left?
  used: number;
  limit: number; // Infinity = unlimited, 0 = feature locked
  locked: boolean; // limit === 0 → not in this plan at all
}

/** Daily-metered features: calorie scans, technique videos. */
export function dailyLimit(
  key: "calorieScan" | "techniqueVideo",
): LimitState {
  const e = entitlements();
  const limit =
    key === "calorieScan" ? e.calorieScansPerDay : e.techniqueVideosPerDay;
  const used = usageToday(key);
  return { ok: used < limit, used, limit, locked: limit === 0 };
}

/** Weekly-metered feature: starting a guided daily plan. */
export function dailyPlanLimit(): LimitState {
  const limit = entitlements().dailyPlansPerWeek;
  const used = usageThisWeek("dailyPlan");
  return { ok: used < limit, used, limit, locked: limit === 0 };
}
