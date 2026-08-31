/* ===========================================================================
   RINGBORNN — subscription plans & entitlements.
   A 7-day free trial (Budget-level access) then one of three paid tiers.
   Every feature reads its access + numeric limits from the active plan's
   entitlements, so gating lives in one place. Billing runs through Paddle as
   merchant of record: /api/billing/checkout opens it, and the webhook writes
   the plan back. `setPlan` remains for the local/offline path only.
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
  nutritionMealSlots: number; // 0 locked · 3 = pro · 4 = every meal
  calorieScansPerDay: number; // 0 = feature locked
  /* Fresh AI meal plans per day. This was uncapped, and the page generated one
     on every single mount — so opening /nutrition twenty times cost twenty
     plans. A plan covers one day, so a small number is the honest allowance:
     one for the day, plus room to redo it with different preferences. */
  nutritionPlansPerDay: number; // 0 = local engine only
  /* The onboarding coach analysis. It was the one AI route with no ceiling at
     all: the code assumed it runs once at the end of onboarding, but nothing
     made that true, so a single signed-in account could call the most
     expensive endpoint in the app in a loop.

     A small number rather than one, because re-running it is legitimate --
     people change goal, weight or timeframe and want the read again. Two a
     day covers that -- it is sixty times more than anyone really re-runs it --
     and caps a runaway account at about four cents. */
  coachAnalysesPerDay: number;
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
    nutritionPlansPerDay: 0,
    coachAnalysesPerDay: 2,
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
    nutritionPlansPerDay: 0,
    /* Nothing else is open to an expired account either; the route falls back
       to the local engine, so they still get a read, just not a generated one. */
    coachAnalysesPerDay: 0,
  },
  /* Was 0 scans, which made Budget worse than the free trial it follows —
     nobody pays to lose a feature they already had for a week. Budget's real
     pitch is "keep what the trial gave you," so it has to at least match it. */
  budget: {
    ranks: false,
    streaks: true,
    restRecovery: true,
    lessonTier: "limited",
    dailyPlansPerWeek: 3,
    aiNutrition: false,
    nutritionMealSlots: 0,
    calorieScansPerDay: 2,
    nutritionPlansPerDay: 0,
    coachAnalysesPerDay: 2,
  },
  /* Pro is the plan meant to be bought: generous enough that the limits are
     not felt by a normal user. Five scans covers every meal of a day. */
  pro: {
    ranks: true,
    streaks: true,
    restRecovery: true,
    lessonTier: "small",
    dailyPlansPerWeek: INF,
    aiNutrition: true,
    nutritionMealSlots: 3,
    calorieScansPerDay: 5,
    nutritionPlansPerDay: 3,
    coachAnalysesPerDay: 2,
  },
  /* Max is "no limits", which is a story someone can hold in their head --
     unlike "six of this and four of that". The scan ceiling is a real number
     rather than Infinity because each one costs us money at the AI provider:
     15 a day is three times what Pro allows and still well past what anyone
     eats in a day, so it is a ceiling nobody honest will meet -- while
     halving what a leaked account could spend before anyone notices. */
  max: {
    ranks: true,
    streaks: true,
    restRecovery: true,
    lessonTier: "full",
    dailyPlansPerWeek: INF,
    aiNutrition: true,
    nutritionMealSlots: 4,
    calorieScansPerDay: 15,
    /* Was Infinity, which contradicted the paragraph above: a generated meal
       plan costs about the same as a scan, so leaving it uncapped left the
       one hole the scan ceiling exists to prevent. Ten a day is three times
       Pro and more than anyone plans in a day -- it is not advertised
       anywhere, and no real user will meet it. */
    nutritionPlansPerDay: 10,
    coachAnalysesPerDay: 2,
  },
};

/** How the plan is billed. Entitlements are identical either way — only the
    price and the renewal date differ. */
export type BillingPeriod = "monthly" | "yearly";

export const PRICES: Record<PaidPlanId, number> = {
  budget: 9.99,
  pro: 24.99,
  /* Was 79.99, which was 3.2x Pro for the same product with the limits taken
     off -- a price nobody was going to reach for. */
  max: 49.99,
};

/* Yearly is a smaller discount than the old flat "2 months free": the point is
   to reward committing, not to undercut the monthly plan we actually want
   people on. Budget gets the deepest cut because it is the tier most likely to
   be abandoned after a month. Each lands on a .99 so it reads as a price. */
export const PRICES_YEARLY: Record<PaidPlanId, number> = {
  budget: 101.99, // 15% off 119.88
  pro: 269.99, //    10% off 299.88
  max: 539.99, //    10% off 599.88
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

/** The smallest saving any tier gets, for the one badge that has to speak for
    all three. The floor rather than the best of them: a badge promising 15%
    to someone about to buy Pro at 10% is a number they can check. */
export function minYearlySavingPct(): number {
  return Math.min(...PAID_PLANS.map(yearlySavingPct));
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
  nutritionPlansPerDay: INF,
  calorieScansPerDay: INF,
  coachAnalysesPerDay: INF,
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
