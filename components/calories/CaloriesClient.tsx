"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AppNav } from "@/components/nav/AppNav";
import { CalorieCard } from "@/components/dashboard/CalorieCard";
import { MacroPanel } from "@/components/nutrition/MacroPanel";
import { MicroPanel } from "@/components/nutrition/MicroPanel";
import { WaterCard } from "@/components/nutrition/WaterCard";
import { useTodayNutrition } from "@/components/nutrition/useTodayNutrition";
import { Icon } from "@/components/ui/Icons";

/* The day's intake in one place: calories in the counter, then the breakdown
   that tells you whether those calories were any good — macros, water, and the
   minerals a fighter's diet tends to miss.

   The panels read today's meals through a subscription rather than props from
   the counter, so logging a meal updates all of them at once. */

export function CaloriesClient() {
  const t = useTranslations("calories");
  const { meals, profile, ready } = useTodayNutrition();

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
          {t("titlePre")}
          <span className="text-blood">{t("titleAccent")}</span>
        </h1>
        <p className="mt-3 max-w-xl text-ash">{t("sub")}</p>

        <div className="mt-8 space-y-4">
          <CalorieCard />
          {/* Hidden until localStorage has been read: rendering zeros first and
              correcting them a frame later reads as the numbers being wrong. */}
          {ready && (
            <>
              <MacroPanel meals={meals} profile={profile} />
              <WaterCard />
              <MicroPanel meals={meals} profile={profile} />
            </>
          )}
        </div>

        <Link
          href="/nutrition"
          className="panel mt-4 flex items-center justify-between gap-4 p-5 transition-colors hover:border-blood/40"
        >
          <span className="flex items-center gap-3">
            <span className="text-blood">
              <Icon name="nutrition" size={20} />
            </span>
            <span>
              <span className="block font-condensed text-sm font-bold uppercase tracking-widest">
                {t("nutritionLinkTitle")}
              </span>
              <span className="mt-0.5 block text-sm text-ash">{t("nutritionLinkSub")}</span>
            </span>
          </span>
          <span className="shrink-0 text-ash-dim">
            <Icon name="arrow" size={18} />
          </span>
        </Link>
      </main>
    </div>
  );
}
