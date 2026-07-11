/* ===========================================================================
   RINGBORNN — subscription plans & entitlements.
   A 7-day free trial (full access) then one of three paid tiers. Every feature
   reads its access + numeric limits from the active plan's entitlements, so
   gating lives in one place. Billing is not wired yet — `setPlan` just records
   the choice locally; a later Stripe pass swaps that for a real checkout.
   =========================================================================== */

export type PaidPlanId = "budget" | "pro" | "max";
export type PlanId = "trial" | "expired" | PaidPlanId;

/** How much of the Lesson Library a tier can see. */
export type LessonTier = "none" | "limited" | "small" | "full";

export interface Entitlements {
  ranks: boolean;
  streaks: boolean;
  restRecovery: boolean;
  lessonTier: LessonTier;
  dailyPlansPerWeek: number; // Infinity = unlimited
  aiNutrition: boolean;
  nutritionMealSlots: number; // 0 locked · 2 = pro (pick 2) · 4 = all
  calorieScansPerDay: number; // 0 = feature locked
  techniqueVideosPerDay: number; // 0 = feature locked
}

const INF = Number.POSITIVE_INFINITY;

export const ENTITLEMENTS: Record<PlanId, Entitlements> = {
  // trial = full Max-level access, unlimited, for 7 days
  trial: {
    ranks: true,
    streaks: true,
    restRecovery: true,
    lessonTier: "full",
    dailyPlansPerWeek: INF,
    aiNutrition: true,
    nutritionMealSlots: 4,
    calorieScansPerDay: INF,
    techniqueVideosPerDay: INF,
  },
  // trial ended, no plan chosen — streaks stay (engagement), rest is paywalled
  expired: {
    ranks: false,
    streaks: true,
    restRecovery: false,
    lessonTier: "none",
    dailyPlansPerWeek: 0,
    aiNutrition: false,
    nutritionMealSlots: 0,
    calorieScansPerDay: 0,
    techniqueVideosPerDay: 0,
  },
  budget: {
    ranks: false,
    streaks: true,
    restRecovery: true,
    lessonTier: "limited",
    dailyPlansPerWeek: 3,
    aiNutrition: false,
    nutritionMealSlots: 0,
    calorieScansPerDay: 0,
    techniqueVideosPerDay: 0,
  },
  pro: {
    ranks: true,
    streaks: true,
    restRecovery: true,
    lessonTier: "small",
    dailyPlansPerWeek: INF,
    aiNutrition: true,
    nutritionMealSlots: 2,
    calorieScansPerDay: 2,
    techniqueVideosPerDay: 2,
  },
  max: {
    ranks: true,
    streaks: true,
    restRecovery: true,
    lessonTier: "full",
    dailyPlansPerWeek: INF,
    aiNutrition: true,
    nutritionMealSlots: 4,
    calorieScansPerDay: 10,
    techniqueVideosPerDay: 8,
  },
};

export const PRICES: Record<PaidPlanId, number> = {
  budget: 9.99,
  pro: 24.99,
  max: 79.99,
};

export const PAID_PLANS: PaidPlanId[] = ["budget", "pro", "max"];

export const TRIAL_DAYS = 7;
export const TRIAL_WARN_DAY = 4; // start warning on day 4 of 7

export function entitlementsFor(plan: PlanId): Entitlements {
  return ENTITLEMENTS[plan];
}

/** Max number of library exercises a tier may see. */
export function lessonLimitFor(tier: LessonTier): number {
  switch (tier) {
    case "none":
      return 0;
    case "limited":
      return 18;
    case "small":
      return 40;
    case "full":
      return INF;
  }
}

export function priceLabel(n: number): string {
  return `$${n.toFixed(2)}`;
}
