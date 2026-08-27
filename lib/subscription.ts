/* ===========================================================================
   RINGBORNN — subscription plans & entitlements.
   A 7-day free trial (Budget-level access) then one of three paid tiers.
   Every feature reads its access + numeric limits from the active plan's
   entitlements, so gating lives in one place. Billing is not wired yet —
   `setPlan` just records the choice locally; a later Stripe pass swaps that
   for a real checkout.
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
  /* Text questions to the coach. Allowances are far higher than the vision
     features because a question costs roughly a tenth of a photo scan — the
     limit is here to bound abuse, not to ration the feature. */
  coachAsksPerDay: number; // 0 = feature locked
  /* Fresh AI meal plans per day. This was uncapped, and the page generated one
     on every single mount — so opening /nutrition twenty times cost twenty
     plans. A plan covers one day, so a small number is the honest allowance:
     one for the day, plus room to redo it with different preferences. */
  nutritionPlansPerDay: number; // 0 = local engine only
}

const INF = Number.POSITIVE_INFINITY;

export const ENTITLEMENTS: Record<PlanId, Entitlements> = {
  /* trial = Budget-level access for 7 days: a real taste, not the whole meal.
     The one deliberate exception is the meal scanner. It was locked to zero,
     which meant nobody could try the single feature that makes people say
     "oh" out loud — they met a padlock instead. Two a day is enough to
     photograph lunch and dinner and understand what they would be paying
     for, and it is bounded: two scans is a fraction of a cent, and the trial
     is seven days long. */
  trial: {
    ranks: false,
    streaks: true,
    restRecovery: true,
    lessonTier: "limited",
    dailyPlansPerWeek: 3,
    aiNutrition: false,
    nutritionMealSlots: 0,
    calorieScansPerDay: 2,
    techniqueVideosPerDay: 0,
    coachAsksPerDay: 3,
    nutritionPlansPerDay: 0,
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
    coachAsksPerDay: 0,
    nutritionPlansPerDay: 0,
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
    coachAsksPerDay: 3,
    nutritionPlansPerDay: 0,
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
    coachAsksPerDay: 15,
    nutritionPlansPerDay: 3,
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
    coachAsksPerDay: 50,
    nutritionPlansPerDay: 6,
  },
};

/** How the plan is billed. Entitlements are identical either way — only the
    price and the renewal date differ. */
export type BillingPeriod = "monthly" | "yearly";

export const PRICES: Record<PaidPlanId, number> = {
  budget: 9.99,
  pro: 24.99,
  max: 79.99,
};

/** Yearly = 10 months' money for 12 months — the usual "2 months free". */
export const PRICES_YEARLY: Record<PaidPlanId, number> = {
  budget: 99.99,
  pro: 249.99,
  max: 799.99,
};

export function priceFor(plan: PaidPlanId, period: BillingPeriod): number {
  return period === "yearly" ? PRICES_YEARLY[plan] : PRICES[plan];
}

/** What a yearly plan works out to per month, for the comparison line. */
export function perMonthOnYearly(plan: PaidPlanId): number {
  return PRICES_YEARLY[plan] / 12;
}

/** Whole-percent saving from paying yearly instead of monthly. */
export function yearlySavingPct(plan: PaidPlanId): number {
  const monthlyTotal = PRICES[plan] * 12;
  return Math.round(((monthlyTotal - PRICES_YEARLY[plan]) / monthlyTotal) * 100);
}

export const PAID_PLANS: PaidPlanId[] = ["budget", "pro", "max"];
export const BILLING_PERIODS: BillingPeriod[] = ["monthly", "yearly"];

export const TRIAL_DAYS = 7;
export const TRIAL_WARN_DAY = 4; // start warning on day 4 of 7

/** QA MODE — opens every feature regardless of plan so the whole app can be
    tested end-to-end. OFF: real plan gating is live. Flip to true only for
    testing, and never leave it on once money is involved. */
export const TEST_UNLOCK_ALL = false;

/** Everything on, no limits — used while TEST_UNLOCK_ALL is true. */
export const UNLOCKED: Entitlements = {
  ranks: true,
  streaks: true,
  restRecovery: true,
  lessonTier: "full",
  dailyPlansPerWeek: INF,
  aiNutrition: true,
  nutritionMealSlots: 4,
  coachAsksPerDay: INF,
  nutritionPlansPerDay: INF,
  calorieScansPerDay: INF,
  techniqueVideosPerDay: INF,
};

export function entitlementsFor(plan: PlanId): Entitlements {
  if (TEST_UNLOCK_ALL) return UNLOCKED;
  return ENTITLEMENTS[plan];
}

/** Max number of library lessons a tier may see (the library is the curated
    boxing-teaching set — techniques/combos/defense/movement, ~16 lessons). */
export function lessonLimitFor(tier: LessonTier): number {
  switch (tier) {
    case "none":
      return 0;
    case "limited":
      return 8;
    case "small":
      return 12;
    case "full":
      return INF;
  }
}

export function priceLabel(n: number): string {
  return `$${n.toFixed(2)}`;
}
