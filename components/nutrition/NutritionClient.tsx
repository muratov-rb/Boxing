"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icons";
import { loadProfile, entitlements } from "@/lib/tracking";
import {
  requestNutrition,
  type NutritionPlan,
  type NutritionPrefs,
  type Slot,
} from "@/lib/nutrition";
import { loadTodaysPlan, saveTodaysPlan } from "@/lib/nutrition-cache";
import { statIssues, type Profile } from "@/lib/onboarding";
import { LockedFeature } from "@/components/dashboard/LockedFeature";
import { AppNav } from "@/components/nav/AppNav";

const SLOT_ICON: Record<Slot, IconName> = {
  breakfast: "bolt",
  lunch: "nutrition",
  dinner: "nutrition",
  snack: "calorie",
  night_snack: "rest",
};

export function NutritionClient() {
  const t = useTranslations("nutri");
  const tp = useTranslations("plans");
  const locale = useLocale() === "ru" ? "ru" : "en";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [access, setAccess] = useState<{ ai: boolean; slots: number } | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState<NutritionPrefs>({
    budget: "normal",
    diet: "any",
    prep: "any",
    avoid: "",
  });

  /* Today's plan is cached, and generating is an explicit act.

     This page used to fetch on every mount, so a plan was generated — and
     paid for — each time someone opened it, even to re-read the meals they
     already had. A plan covers one day, so today's is kept until tomorrow and
     a new one is only made when asked for. */
  useEffect(() => {
    const e = entitlements();
    setAccess({ ai: e.aiNutrition, slots: e.nutritionMealSlots });
    if (!e.aiNutrition) {
      setLoaded(true);
      return; // feature not in this plan — don't fetch
    }
    const p = loadProfile();
    setProfile(p);

    const cached = loadTodaysPlan();
    if (cached) setPlan(cached);
    else if (p && statIssues(p).length === 0) {
      /* Nothing yet today: make the first one automatically, so arriving on
         the page still shows a plan rather than an empty screen and a button. */
      setLoading(true);
      requestNutrition(p, locale)
        .then((fresh) => {
          setPlan(fresh);
          saveTodaysPlan(fresh);
        })
        .finally(() => setLoading(false));
    }
    setLoaded(true);
  }, [locale]);

  const regenerate = async (next: NutritionPrefs) => {
    if (!profile || loading) return;
    setLoading(true);
    setPrefsOpen(false);
    try {
      const fresh = await requestNutrition(profile, locale, next);
      setPlan(fresh);
      saveTodaysPlan(fresh);
    } finally {
      setLoading(false);
    }
  };

  /* Pro sees the first three meals of the day; Max sees all five.
     Plain min() rather than the old `slots >= 4 ? everything : slots`: that
     test was a stand-in for "this tier gets the lot", and it stopped being
     true the moment Max went to five slots. Nobody without aiNutrition
     reaches here -- the effect above returns before a plan is ever fetched --
     so slots is 3 or 5 and min() is simply the answer. */
  const shownMeals = plan && access ? plan.meals.slice(0, Math.min(access.slots, plan.meals.length)) : [];
  /* Compare what is on screen, not the slot number, or a tier that happens to
     match the plan length gets told to upgrade to the tier it is on. */
  const mealsLimited = !!plan && shownMeals.length < plan.meals.length;

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
      <AppNav />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
          {t("titlePre")}
          <span className="text-blood">{t("titleAccent")}</span>
        </h1>
        <p className="mt-3 max-w-xl text-ash">
          {plan?.headline || t("sub")}
        </p>

        {/* Ask for a different day. Not a refresh button: the plan is for one
            day and re-reading it is free, so this exists for "I can't afford
            that this week" rather than for shuffling until something appeals. */}
        {loaded && access?.ai && profile && plan && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setPrefsOpen((v) => !v)}
              aria-expanded={prefsOpen}
              className="btn btn-ghost !px-5 !py-2.5 text-xs"
            >
              <Icon name="nutrition" size={14} /> {t("adjustCta")}
            </button>

            {prefsOpen && (
              <div className="panel mt-3 p-5">
                <p className="text-xs leading-relaxed text-ash-dim">{t("adjustSub")}</p>

                {(
                  [
                    ["budget", ["tight", "normal", "comfortable"]],
                    ["diet", ["any", "vegetarian", "halal", "nodairy"]],
                    ["prep", ["any", "quick"]],
                  ] as const
                ).map(([group, options]) => (
                  <div key={group} className="mt-4">
                    <p className="font-condensed text-[0.65rem] uppercase tracking-widest text-ash">
                      {t(`pref_${group}`)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setPrefs((p) => ({ ...p, [group]: opt }))}
                          aria-pressed={prefs[group] === opt}
                          className={`min-h-[40px] rounded-xl border px-3.5 font-condensed text-xs uppercase tracking-wider transition-colors ${
                            prefs[group] === opt
                              ? "border-blood bg-blood/10 text-bone"
                              : "border-line text-ash hover:border-blood/50"
                          }`}
                        >
                          {t(`opt_${opt}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mt-4">
                  <p className="font-condensed text-[0.65rem] uppercase tracking-widest text-ash">
                    {t("pref_avoid")}
                  </p>
                  <input
                    value={prefs.avoid ?? ""}
                    onChange={(e) => setPrefs((p) => ({ ...p, avoid: e.target.value }))}
                    maxLength={120}
                    placeholder={t("avoidPlaceholder")}
                    className="mt-2 w-full rounded-md border border-line bg-void px-3.5 py-2.5 text-base text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void regenerate(prefs)}
                  disabled={loading}
                  className="btn btn-primary mt-5 w-full !py-2.5 text-sm disabled:opacity-40"
                >
                  {loading ? t("building") : t("rebuild")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* not in this plan */}
        {loaded && access && !access.ai && (
          <div className="mt-8">
            <LockedFeature icon="nutrition" title={tp("f_nutrition")} body={tp("lockedNutrition")} />
          </div>
        )}

        {/* no profile yet */}
        {loaded && access?.ai && !profile && (
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
              {shownMeals.map((meal) => (
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
            {mealsLimited && (
              <Link
                href="/plans"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-blood/40 bg-blood/5 px-4 py-3 text-sm text-ash transition-colors hover:text-bone"
              >
                <Icon name="lock" size={14} /> {tp("mealsLimited")}
              </Link>
            )}

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

          </>
        )}
      </main>
    </div>
  );
}
