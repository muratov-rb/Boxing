"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { Icon, type IconName } from "@/components/ui/Icons";
import { loadProfile } from "@/lib/tracking";
import { requestNutrition, type NutritionPlan, type Slot } from "@/lib/nutrition";
import { statIssues, type Profile } from "@/lib/onboarding";

const SLOT_ICON: Record<Slot, IconName> = {
  breakfast: "bolt",
  lunch: "nutrition",
  dinner: "nutrition",
  snack: "calorie",
};

export function NutritionClient() {
  const t = useTranslations("nutri");
  const locale = useLocale() === "ru" ? "ru" : "en";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    setLoaded(true);
    if (p && statIssues(p).length === 0) {
      setLoading(true);
      requestNutrition(p, locale)
        .then(setPlan)
        .finally(() => setLoading(false));
    }
  }, [locale]);

  const macroItems = plan
    ? [
        { key: "kcal", value: plan.macros.kcal, unit: "" },
        { key: "protein", value: plan.macros.protein, unit: "g" },
        { key: "carbs", value: plan.macros.carbs, unit: "g" },
        { key: "fat", value: plan.macros.fat, unit: "g" },
      ]
    : [];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-void/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-3">
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
          {t("titlePre")}
          <span className="text-blood">{t("titleAccent")}</span>
        </h1>
        <p className="mt-3 max-w-xl text-ash">
          {plan?.headline || t("sub")}
        </p>

        {/* no profile yet */}
        {loaded && !profile && (
          <div className="panel mt-8 p-7 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-blood/40 text-blood">
              <Icon name="nutrition" size={26} />
            </div>
            <p className="mt-4 text-ash">{t("noProfile")}</p>
            <Link href="/onboarding" className="btn btn-primary mt-5">
              {t("buildProfile")}
              <Icon name="arrow" size={18} />
            </Link>
          </div>
        )}

        {/* impossible stats */}
        {loaded && profile && statIssues(profile).length > 0 && (
          <div className="panel mt-8 p-7">
            <p className="text-ash">{t("fixStats")}</p>
            <Link href="/onboarding" className="btn btn-ghost mt-4">
              {t("buildProfile")}
              <Icon name="arrow" size={18} />
            </Link>
          </div>
        )}

        {loading && (
          <div className="panel mt-8 p-10 text-center">
            <div className="animate-glow mx-auto grid h-14 w-14 place-items-center rounded-full text-blood">
              <Icon name="nutrition" size={28} />
            </div>
            <p className="mt-4 font-condensed text-sm uppercase tracking-[0.25em] text-ash">
              {t("building")}
            </p>
          </div>
        )}

        {plan && !loading && (
          <>
            {/* macro targets */}
            <section className="panel mt-8 p-6">
              <h2 className="font-condensed text-sm font-bold uppercase tracking-widest text-ash">
                {t("targetsTitle")}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {macroItems.map((m) => (
                  <div key={m.key} className="text-center">
                    <p className="font-display text-3xl leading-none sm:text-4xl">
                      {m.value}
                      <span className="text-lg text-ash-dim">{m.unit}</span>
                    </p>
                    <p className="mt-1.5 font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                      {t(m.key)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-ash-dim">{t("perDay")}</p>
            </section>

            {/* meals */}
            <h2 className="mt-10 font-condensed text-sm font-bold uppercase tracking-widest text-ash">
              {t("mealsTitle")}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {plan.meals.map((meal) => (
                <div key={meal.slot} className="panel p-5">
                  <div className="flex items-center justify-between">
                    <span className="badge border-blood/40 text-blood">
                      <Icon name={SLOT_ICON[meal.slot]} size={12} /> {t(`slot_${meal.slot}`)}
                    </span>
                    <span className="font-condensed text-xs uppercase tracking-wider text-ash-dim">
                      {meal.kcal} kcal · {meal.protein}g {t("proteinShort")}
                    </span>
                  </div>
                  <h3 className="mt-3 font-condensed text-lg font-bold uppercase tracking-wide">
                    {meal.title}
                  </h3>
                  <p className="mt-1 text-sm text-ash">{meal.detail}</p>
                </div>
              ))}
            </div>

            {/* tips */}
            {plan.tips.length > 0 && (
              <>
                <h2 className="mt-10 font-condensed text-sm font-bold uppercase tracking-widest text-ash">
                  {t("tipsTitle")}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {plan.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-bone/90">
                      <span className="mt-0.5 text-blood">
                        <Icon name="check" size={16} />
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="mt-8 flex items-center gap-2 border-t border-line/70 pt-5 text-xs text-ash-dim">
              <Icon name="lock" size={12} />
              {plan.source === "ai" ? t("aiNote") : t("localNote")}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
