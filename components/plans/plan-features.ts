import type { Entitlements } from "@/lib/subscription";

/* What each plan includes, as the rows the plans page shows.

   Shared by the plans page and the checkout summary, so the list a person
   picked a plan from and the list next to the card form they pay with can
   never disagree. Values are derived from the plan's entitlements, never
   written out by hand. */

const INF = Number.POSITIVE_INFINITY;

export const FEATURE_KEYS = [
  "dailyPlans",
  "ranks",
  "streaks",
  "lessons",
  "nutrition",
  "calorie",
  "recovery",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

/** The value shown for one feature row, derived from a plan's entitlements.
    `t` is the "plans" namespace translator. */
export function featureCell(
  e: Entitlements,
  key: string,
  t: (k: string, v?: Record<string, number>) => string,
): { on: boolean; text: string } {
  switch (key) {
    case "dailyPlans":
      return e.dailyPlansPerWeek === INF
        ? { on: true, text: t("vFull") }
        : e.dailyPlansPerWeek === 0
          ? { on: false, text: t("vNo") }
          : { on: true, text: t("vPerWeek", { n: e.dailyPlansPerWeek }) };
    case "ranks":
      return { on: e.ranks, text: e.ranks ? t("vYes") : t("vNo") };
    case "streaks":
      return { on: e.streaks, text: e.streaks ? t("vYes") : t("vNo") };
    case "lessons":
      return e.lessonTier === "none"
        ? { on: false, text: t("vNo") }
        : e.lessonTier === "limited"
          ? { on: true, text: t("vLessonsLimited") }
          : e.lessonTier === "small"
            ? { on: true, text: t("vLessonsSmall") }
            : { on: true, text: t("vLessonsFull") };
    case "nutrition":
      return !e.aiNutrition
        ? { on: false, text: t("vNo") }
        : e.nutritionMealSlots >= 4
          ? { on: true, text: t("vFull") }
          : { on: true, text: t("vMeals", { n: e.nutritionMealSlots }) };
    case "calorie":
      return e.calorieScansPerDay === 0
        ? { on: false, text: t("vNo") }
        : e.calorieScansPerDay === INF
          ? { on: true, text: t("vUnlimited") }
          : { on: true, text: t("vPerDay", { n: e.calorieScansPerDay }) };
    case "recovery":
      return { on: e.restRecovery, text: e.restRecovery ? t("vYes") : t("vNo") };
    default:
      return { on: false, text: t("vNo") };
  }
}
