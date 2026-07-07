/* ===========================================================================
   PRESSURE — local tracking: streaks, meals/calories, saved profile.
   Stored per-browser in localStorage for now; the shapes are flat JSON so a
   later pass can sync them to Supabase without reworking the UI.
   =========================================================================== */

import type { Profile } from "./onboarding";

const K_PROFILE = "pressure.profile";
const K_STREAK = "pressure.streak"; // string[] of "YYYY-MM-DD"
const K_MEALS = "pressure.meals"; // Record<date, Meal[]>

export interface Meal {
  id: string;
  name: string;
  kcal: number;
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

/* ------------------------------ meals/kcal ------------------------------- */
export function mealsToday(): Meal[] {
  const all = read<Record<string, Meal[]>>(K_MEALS, {});
  return all[todayKey()] ?? [];
}

export function addMeal(name: string, kcal: number, source: Meal["source"]): Meal[] {
  const all = read<Record<string, Meal[]>>(K_MEALS, {});
  const key = todayKey();
  const meal: Meal = {
    id: Math.random().toString(36).slice(2, 10),
    name: name.trim() || "—",
    kcal: Math.max(0, Math.round(kcal)),
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
