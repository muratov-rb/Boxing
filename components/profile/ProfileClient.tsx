"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { AppNav } from "@/components/nav/AppNav";
import { DangerZone } from "@/components/dashboard/DangerZone";
import {
  rankProgress,
  rankName,
  currentStreak,
  bestUsageStreak,
  totalTrainedDays,
  totalUsageDays,
  loadProfile,
  activePlan,
  billingPeriod,
  trialDaysLeft,
} from "@/lib/tracking";
import { priceLabel, priceFor, type PlanId } from "@/lib/subscription";

/* The account page: who you are, what you have done, and what you are paying.

   These three used to be scattered — plan on /plans, progress on the
   dashboard, deletion at the bottom of the dashboard — which meant "where do I
   cancel" had no obvious answer. */

interface Stats {
  rankIndex: number;
  xp: number;
  pctToNext: number;
  toNext: number;
  atMax: boolean;
  streak: number;
  bestStreak: number;
  trainedDays: number;
  visitDays: number;
}

export function ProfileClient({ email }: { email: string | null }) {
  const t = useTranslations("profile");
  const tp = useTranslations("plans");
  const [stats, setStats] = useState<Stats | null>(null);
  const [plan, setPlan] = useState<PlanId>("trial");
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [trialLeft, setTrialLeft] = useState(0);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const r = rankProgress();
    setStats({
      rankIndex: r.rankIndex,
      xp: r.xp,
      pctToNext: r.pctToNext,
      toNext: r.toNext,
      atMax: r.atMax,
      streak: currentStreak(),
      bestStreak: bestUsageStreak(),
      trainedDays: totalTrainedDays(),
      visitDays: totalUsageDays(),
    });
    setPlan(activePlan());
    setPeriod(billingPeriod());
    setTrialLeft(trialDaysLeft());
    const p = loadProfile();
    setName(p?.path ? p.path : null);
  }, []);

  const paid = plan === "budget" || plan === "pro" || plan === "max";

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
          {t("titlePre")}
          <span className="text-blood">{t("titleAccent")}</span>
        </h1>

        {/* ------------------------------ account ----------------------------- */}
        <section className="panel mt-8 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-blood/40 text-blood">
              <Icon name="user" size={26} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg text-bone">{email ?? t("noEmail")}</p>
              <p className="mt-0.5 font-condensed text-xs uppercase tracking-widest text-ash-dim">
                {name ? tp(`${name}Label`) : t("noPath")}
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------- your numbers -------------------------- */}
        <h2 className="mt-10 font-condensed text-sm font-bold uppercase tracking-widest text-ash">
          {t("statsTitle")}
        </h2>

        {stats && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["statStreak", stats.streak, "streak"],
                  ["statBest", stats.bestStreak, "bolt"],
                  ["statTrained", stats.trainedDays, "gloves"],
                  ["statDays", stats.visitDays, "check"],
                ] as const
              ).map(([key, value, icon]) => (
                <div key={key} className="panel p-4">
                  <span className="text-blood">
                    <Icon name={icon} size={17} />
                  </span>
                  <p className="mt-2 font-display text-3xl leading-none">{value}</p>
                  <p className="mt-1 font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                    {t(key)}
                  </p>
                </div>
              ))}
            </div>

            {/* rank */}
            <div className="panel mt-3 p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-condensed text-xs uppercase tracking-widest text-ash-dim">
                    {t("rankLabel")}
                  </p>
                  <p className="mt-1 font-display text-3xl uppercase leading-none text-blood">
                    {rankName(stats.rankIndex)}
                  </p>
                </div>
                <p className="font-condensed text-sm text-ash">
                  {stats.atMax
                    ? t("rankMaxed")
                    : t("rankToNext", { xp: stats.toNext })}
                </p>
              </div>
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full border border-line/60 bg-void">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blood to-ember transition-[width] duration-700 motion-reduce:transition-none"
                  style={{ width: `${stats.pctToNext}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-ash-dim">{t("xpTotal", { xp: stats.xp })}</p>
            </div>
          </>
        )}

        {/* ------------------------------ billing ----------------------------- */}
        <h2 className="mt-10 font-condensed text-sm font-bold uppercase tracking-widest text-ash">
          {t("billingTitle")}
        </h2>

        <section className="panel mt-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-condensed text-xs uppercase tracking-widest text-ash-dim">
                {t("currentPlan")}
              </p>
              <p className="mt-1 font-display text-3xl uppercase leading-none">
                {tp(`plan_${plan}`) || plan}
              </p>
              <p className="mt-1.5 text-sm text-ash">
                {plan === "trial"
                  ? t("trialLeft", { n: trialLeft })
                  : paid
                    ? t("billedAs", {
                        price: priceLabel(priceFor(plan as "budget" | "pro" | "max", period)),
                        period: tp(`period_${period}`),
                      })
                    : t("noPlan")}
              </p>
            </div>
            <Link href="/plans" className="btn btn-primary !px-5 !py-2.5 text-xs">
              {paid ? t("changePlan") : t("seePlans")}
            </Link>
          </div>
        </section>

        {/* account + billing management live together, at the end */}
        <DangerZone />
      </main>
    </div>
  );
}
