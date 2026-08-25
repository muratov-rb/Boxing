"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { NutrientRing } from "./NutrientRing";
import { macroTargets, type Meal } from "@/lib/tracking";
import { fiberTarget } from "@/lib/nutrients";
import type { Profile } from "@/lib/onboarding";

/* The four dials that actually decide whether a day of eating worked.

   Protein leads because it is the one people under-eat while training, and it
   gets the brand red for that reason; the others read as supporting numbers. */

export function MacroPanel({ meals, profile }: { meals: Meal[]; profile: Profile | null }) {
  const t = useTranslations("macro");
  const targets = macroTargets(profile);

  const sum = (pick: (m: Meal) => number | undefined) =>
    meals.reduce((total, m) => total + (pick(m) ?? 0), 0);

  const protein = sum((m) => m.protein);
  const carbs = sum((m) => m.carbs);
  const fat = sum((m) => m.fat);
  const fiber = sum((m) => m.fiber);
  const fiberGoal = fiberTarget(targets.kcal);

  const logged = protein + carbs + fat > 0;

  return (
    <section className="panel p-6">
      <div className="mb-1 flex items-center gap-2.5">
        <span className="text-blood">
          <Icon name="calorie" size={18} />
        </span>
        <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
          {t("title")}
        </h2>
      </div>
      <p className="text-xs leading-relaxed text-ash-dim">{t("sub")}</p>

      <div className="mt-6 grid grid-cols-4 gap-2">
        <NutrientRing
          label={t("protein")}
          value={protein}
          target={targets.protein}
          unit="g"
          color="var(--color-blood)"
          delay={0}
        />
        <NutrientRing
          label={t("carbs")}
          value={carbs}
          target={targets.carbs}
          unit="g"
          color="var(--color-ember)"
          delay={90}
        />
        <NutrientRing
          label={t("fat")}
          value={fat}
          target={targets.fat}
          unit="g"
          color="var(--color-azure)"
          delay={180}
        />
        <NutrientRing
          label={t("fiber")}
          value={fiber}
          target={fiberGoal}
          unit="g"
          color="var(--color-ash)"
          delay={270}
        />
      </div>

      {!logged && <p className="mt-5 text-sm leading-relaxed text-ash">{t("empty")}</p>}
    </section>
  );
}
