/* ===========================================================================
   PRESSURE — local tracking: streaks, meals/calories, saved profile.
   Stored per-browser in localStorage for now; the shapes are flat JSON so a
   later pass can sync them to Supabase without reworking the UI.
   =========================================================================== */

import { RANKS, type Profile } from "./onboarding";

const K_PROFILE = "pressure.profile";
const K_STREAK = "pressure.streak"; // string[] of training days "YYYY-MM-DD"
const K_MEALS = "pressure.meals"; // Record<date, Meal[]>
const K_VISITS = "pressure.visits"; // string[] of usage days "YYYY-MM-DD"
const K_XP = "pressure.xp"; // XpState
const K_RANK_SEEN = "pressure.rankSeen"; // last rank index the user celebrated

export interface Meal {
  id: string;
  name: string;
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
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

function write(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full/blocked — tracking is best-effort */
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
}

/** XP thresholds, one per RANKS tier (index-aligned). */
export const RANK_XP = [0, 100, 240, 430, 680, 1000, 1400, 1900, 2550, 3400, 4500];

const XP = {
  visit: 8, // opening the app (once/day)
  lesson: 25, // marking a lesson done
  workout: 60, // finishing a guided session
} as const;

const DECAY_PER_DAY = 18; // XP lost per idle day past the grace window
const GRACE_DAYS = 1; // one day off doesn't cost you anything

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
  if (gap <= GRACE_DAYS) return { xp: state.xp, lastActive: state.lastActive };
  const decayed = Math.max(0, Math.round(state.xp - (gap - GRACE_DAYS) * DECAY_PER_DAY));
  return { xp: decayed, lastActive: today };
}

/** Add XP for an action (banks any pending decay first). */
export function awardXp(kind: keyof typeof XP): number {
  const today = todayKey();
  const settled = settleXp(readXp(), today);
  const xp = settled.xp + XP[kind];
  writeXp({ xp, lastActive: today });
  return xp;
}

export function currentXp(): number {
  return settleXp(readXp(), todayKey()).xp;
}

export function rankFromXp(xp: number): number {
  let idx = 0;
  for (let i = 0; i < RANK_XP.length; i++) if (xp >= RANK_XP[i]) idx = i;
  return idx;
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

export function addMeal(
  name: string,
  kcal: number,
  source: Meal["source"],
  macros?: { protein?: number; carbs?: number; fat?: number },
): Meal[] {
  const all = read<Record<string, Meal[]>>(K_MEALS, {});
  const key = todayKey();
  const g = (v?: number) => (typeof v === "number" && v >= 0 ? Math.round(v) : undefined);
  const meal: Meal = {
    id: Math.random().toString(36).slice(2, 10),
    name: name.trim() || "—",
    kcal: Math.max(0, Math.round(kcal)),
    protein: g(macros?.protein),
    carbs: g(macros?.carbs),
    fat: g(macros?.fat),
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
