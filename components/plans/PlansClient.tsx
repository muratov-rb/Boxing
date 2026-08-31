"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ENTITLEMENTS,
  PRICES,
  priceFor,
  perMonthOnYearly,
  yearlySavingPct,
  minYearlySavingPct,
  priceLabel,
  type BillingPeriod,
  type Entitlements,
  type PaidPlanId,
  type PlanId,
} from "@/lib/subscription";
import { activePlan, trialDaysLeft, billingPeriod } from "@/lib/tracking";
import { Icon } from "@/components/ui/Icons";
import { AppNav } from "@/components/nav/AppNav";

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
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [busy, setBusy] = useState<PaidPlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(activePlan());
    setLeft(trialDaysLeft());
    setPeriod(billingPeriod());
  }, []);

  /* With billing live this hands off to Stripe and the plan only changes once
     their webhook confirms payment — the browser never grants itself a tier.
     Until the keys are set the old local behaviour stands, so the page keeps
     working (and stays demoable) exactly as before. */
  const choose = async (id: PaidPlanId) => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: id, period }),
      });

      /* Read the body exactly once — a Response can only be consumed a single
         time, and a second .json() throws rather than returning the payload. */
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (res.ok && data.url) {
        window.location.assign(data.url); // Stripe's hosted checkout
        return;
      }
      if (res.status === 401) {
        window.location.assign("/login?next=/plans");
        return;
      }
      if (data.error === "billing_off" || data.error === "price_not_configured") {
        /* Was: setPlan(id) -- the browser handed itself the tier for free, and
           the sync then wrote it to the database as though it were paid. A
           plan may only ever arrive from the Paddle webhook. */
        setError(t("errBillingOff"));
        return;
      }
      setError(t("checkoutFailed"));
    } catch {
      setError(t("checkoutFailed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav />

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

        {/* billing period */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex overflow-hidden rounded-full border border-line">
            {(["monthly", "yearly"] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={cx(
                  "px-4 py-2 font-condensed text-xs uppercase tracking-widest transition-colors",
                  period === p ? "bg-blood text-white" : "text-ash hover:text-bone",
                )}
              >
                {t(p === "monthly" ? "billMonthly" : "billYearly")}
                {p === "yearly" && (
                  <span
                    className={cx(
                      "ml-2 rounded-full px-1.5 py-0.5 text-[0.6rem]",
                      period === p ? "bg-white/20" : "bg-blood/15 text-blood",
                    )}
                  >
                    −{minYearlySavingPct()}%
                  </span>
                )}
              </button>
            ))}
          </div>
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
                  <span className="absolute -top-3 left-6 badge !border-blood !bg-blood !text-white !backdrop-blur-none">
                    {t("popular")}
                  </span>
                )}
                <h2 className="font-display text-2xl uppercase leading-none">
                  {t(`name_${id}`)}
                </h2>
                <div className="mt-3 flex items-end gap-1">
                  <span className="font-display text-4xl leading-none">
                    {priceLabel(priceFor(id, period))}
                  </span>
                  <span className="mb-1 text-xs text-ash-dim">
                    {period === "yearly" ? t("perYear") : t("perMonth")}
                  </span>
                </div>
                {period === "yearly" ? (
                  <p className="mt-1 text-xs text-ash-dim">
                    {t("yearlyEquiv", { price: priceLabel(perMonthOnYearly(id)) })} ·{" "}
                    <span className="text-blood">
                      {t("yearlySave", {
                        n: yearlySavingPct(id),
                        amount: priceLabel(PRICES[id] * 12 - priceFor(id, "yearly")),
                      })}
                    </span>
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-ash-dim">
                    {t("yearlyHint", {
                      price: priceLabel(priceFor(id, "yearly")),
                      n: yearlySavingPct(id),
                    })}
                  </p>
                )}
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
                  disabled={isCurrent || busy !== null}
                  className={cx(
                    "mt-6 w-full disabled:opacity-60",
                    isCurrent ? "btn btn-ghost" : popular ? "btn btn-primary shine" : "btn btn-primary",
                  )}
                >
                  {isCurrent
                    ? t("yourPlan")
                    : busy === id
                      ? t("checkoutOpening")
                      : t("choose")}
                </button>
                {error && busy === null && (
                  <p className="mt-2 text-center text-xs text-blood-bright">{error}</p>
                )}
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
