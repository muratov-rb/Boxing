"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { activePlan, ensureTrial, trialDay, trialDaysLeft } from "@/lib/tracking";
import { TRIAL_DAYS, TRIAL_WARN_DAY, type PlanId } from "@/lib/subscription";

/* Trial status ribbon. Quiet for the first few days, a clear warning from
   day 4, and a hard "trial ended" prompt once it lapses. Hidden entirely for
   paid plans. */

export function TrialBanner() {
  const t = useTranslations("plans");
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [day, setDay] = useState(1);
  const [left, setLeft] = useState(TRIAL_DAYS);

  useEffect(() => {
    ensureTrial();
    setPlan(activePlan());
    setDay(trialDay());
    setLeft(trialDaysLeft());
  }, []);

  if (plan === null) return null; // pre-hydration
  if (plan === "budget" || plan === "pro" || plan === "max") return null;

  const expired = plan === "expired";
  const warning = !expired && day >= TRIAL_WARN_DAY;

  const tone = expired
    ? "border-blood/50 bg-blood/10"
    : warning
      ? "border-blood/40 bg-blood/5"
      : "border-azure/40 bg-azure/5";
  const accent = expired || warning ? "text-blood" : "text-azure";

  return (
    <div
      className={`mb-6 flex flex-col items-start justify-between gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center ${tone}`}
    >
      <div className="flex items-center gap-3">
        <span className={accent}>
          <Icon name={expired ? "lock" : "bolt"} size={18} />
        </span>
        <p className="text-sm text-ash">
          <span className="font-semibold text-bone">
            {expired
              ? t("bannerExpiredBold")
              : warning
                ? t("bannerWarnBold", { n: left })
                : t("bannerTrialBold", { day, total: TRIAL_DAYS })}
          </span>{" "}
          {expired ? t("bannerExpiredRest") : warning ? t("bannerWarnRest") : t("bannerTrialRest")}
        </p>
      </div>
      <Link
        href="/plans"
        className={`btn shrink-0 !px-4 !py-2 text-sm ${expired || warning ? "btn-primary" : "btn-ghost"}`}
      >
        {t("seePlans")}
        <Icon name="arrow" size={15} />
      </Link>
    </div>
  );
}
