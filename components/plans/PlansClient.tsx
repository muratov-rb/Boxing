"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ENTITLEMENTS,
  PRICES,
  priceLabel,
  type Entitlements,
  type PaidPlanId,
  type PlanId,
} from "@/lib/subscription";
import { activePlan, setPlan, trialDaysLeft } from "@/lib/tracking";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { Icon } from "@/components/ui/Icons";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
const INF = Number.POSITIVE_INFINITY;

/* value shown for each feature row, derived from a plan's entitlements */
function cell(
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
    case "technique":
      return e.techniqueVideosPerDay === 0
        ? { on: false, text: t("vNo") }
        : e.techniqueVideosPerDay === INF
          ? { on: true, text: t("vUnlimited") }
          : { on: true, text: t("vPerDay", { n: e.techniqueVideosPerDay }) };
    case "recovery":
      return { on: e.restRecovery, text: e.restRecovery ? t("vYes") : t("vNo") };
    default:
      return { on: false, text: t("vNo") };
  }
}

const FEATURE_KEYS = [
  "dailyPlans",
  "ranks",
  "streaks",
  "lessons",
  "nutrition",
  "calorie",
  "technique",
  "recovery",
] as const;

const TIERS: { id: PaidPlanId; popular?: boolean }[] = [
  { id: "budget" },
  { id: "pro", popular: true },
  { id: "max" },
];

export function PlansClient() {
  const t = useTranslations("plans");
  const [current, setCurrent] = useState<PlanId>("trial");
  const [left, setLeft] = useState(7);
  const [justPicked, setJustPicked] = useState<PaidPlanId | null>(null);

  useEffect(() => {
    setCurrent(activePlan());
    setLeft(trialDaysLeft());
  }, []);

  const choose = (id: PaidPlanId) => {
    setPlan(id);
    setCurrent(id);
    setJustPicked(id);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-void/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LocaleSwitcher />
            <Link
              href="/dashboard"
              className="font-condensed text-sm uppercase tracking-widest text-ash transition-colors hover:text-bone"
            >
              {t("backDash")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="text-center">
          <p className="kicker justify-center">{t("kicker")}</p>
          <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
            {t("titlePre")}
            <span className="text-blood">{t("titleAccent")}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-ash">
            {current === "trial"
              ? t("trialLine", { n: left })
              : current === "expired"
                ? t("expiredLine")
                : t("currentLine", { plan: t(`name_${current}`) })}
          </p>
        </div>

        {/* trial banner card */}
        <div
          className={cx(
            "mt-8 flex flex-col items-start justify-between gap-3 rounded-[20px] border p-5 sm:flex-row sm:items-center",
            current === "trial"
              ? "border-azure/40 bg-azure/5"
              : "border-line bg-surface-2",
          )}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-azure/50 text-azure">
              <Icon name="bolt" size={18} />
            </span>
            <div>
              <p className="font-condensed text-sm font-bold uppercase tracking-wide">
                {t("freeTrial")} · {priceLabel(0)}
              </p>
              <p className="text-xs text-ash">{t("freeTrialSub")}</p>
            </div>
          </div>
          <span className="badge border-azure/50 text-azure">
            {current === "trial"
              ? t("daysLeft", { n: left })
              : current === "expired"
                ? t("trialOver")
                : t("onPaid")}
          </span>
        </div>

        {/* tier cards */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {TIERS.map(({ id, popular }) => {
            const e = ENTITLEMENTS[id];
            const isCurrent = current === id;
            return (
              <section
                key={id}
                className={cx(
                  "panel relative flex flex-col p-6",
                  popular && "border-blood/60 ring-1 ring-blood/30",
                )}
              >
                {popular && (
                  <span className="absolute -top-3 left-6 badge !border-blood bg-blood !text-white">
                    {t("popular")}
                  </span>
                )}
                <h2 className="font-display text-2xl uppercase leading-none">
                  {t(`name_${id}`)}
                </h2>
                <div className="mt-3 flex items-end gap-1">
                  <span className="font-display text-4xl leading-none">
                    {priceLabel(PRICES[id])}
                  </span>
                  <span className="mb-1 text-xs text-ash-dim">{t("perMonth")}</span>
                </div>
                <p className="mt-2 text-sm text-ash">{t(`tagline_${id}`)}</p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {FEATURE_KEYS.map((k) => {
                    const c = cell(e, k, t);
                    return (
                      <li key={k} className="flex items-start gap-2.5 text-sm">
                        <span className={cx("mt-0.5", c.on ? "text-blood" : "text-ash-dim")}>
                          <Icon name={c.on ? "check" : "lock"} size={14} />
                        </span>
                        <span className={cx(c.on ? "text-bone/90" : "text-ash-dim line-through")}>
                          {t(`f_${k}`)}
                          {c.on && c.text && (
                            <span className="text-ash-dim"> · {c.text}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <button
                  type="button"
                  onClick={() => choose(id)}
                  disabled={isCurrent}
                  className={cx(
                    "mt-6 w-full",
                    isCurrent ? "btn btn-ghost" : popular ? "btn btn-primary shine" : "btn btn-primary",
                  )}
                >
                  {isCurrent ? t("yourPlan") : t("choose")}
                </button>
              </section>
            );
          })}
        </div>

        {justPicked && (
          <p className="mt-6 rounded-xl border border-azure/40 bg-azure/5 px-4 py-3 text-center text-sm text-ash">
            {t("pickedNote", { plan: t(`name_${justPicked}`) })}
          </p>
        )}

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-ash-dim">
          {t("billingNote")}
        </p>
      </main>
    </div>
  );
}
