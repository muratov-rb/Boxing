import type { NutritionPlan } from "./nutrition";
import { todayKey } from "./tracking";

/* Today's meal plan, kept until tomorrow.

   A plan covers a single day, so re-reading it should not cost anything. The
   page used to request a fresh one on every mount, which meant opening
   /nutrition to check what was for dinner generated — and paid for — a whole
   new day of meals.

   Stored under its own key rather than in the tracking blob: it is a cache
   with a natural expiry, not user data worth syncing between devices. */

const KEY = "pressure.nutritionPlan";

interface Cached {
  day: string;
  plan: NutritionPlan;
}

export function loadTodaysPlan(): NutritionPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cached;
    /* Yesterday's plan is not today's plan. Returning null here is what makes
       the page generate a fresh one on the first visit of a new day. */
    if (c?.day !== todayKey()) return null;
    return c.plan?.meals?.length ? c.plan : null;
  } catch {
    return null;
  }
}

export function saveTodaysPlan(plan: NutritionPlan): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ day: todayKey(), plan } satisfies Cached));
  } catch {
    /* storage full or blocked — the page still works, it just re-generates */
  }
}
