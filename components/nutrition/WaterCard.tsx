"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { addWater, loadProfile, resetWaterToday, trainedToday, waterToday } from "@/lib/tracking";
import { GLASS_ML, formatWater, waterTarget } from "@/lib/nutrients";

/* Water, logged a glass at a time.

   No typing: hydration only gets tracked if logging it costs one tap, and a
   number field would make people stop after a day. The glasses are the control
   AND the display, so you can see the day at a glance. */

export function WaterCard() {
  const t = useTranslations("water");
  const [ml, setMl] = useState(0);
  const [target, setTarget] = useState(2500);
  const [splash, setSplash] = useState(0); // bumped per drink to retrigger the animation

  useEffect(() => {
    setMl(waterToday());
    setTarget(waterTarget(loadProfile(), trainedToday()));
  }, []);

  const glassesNeeded = Math.max(1, Math.ceil(target / GLASS_ML));
  const glassesDrunk = Math.floor(ml / GLASS_ML);
  const pct = target > 0 ? Math.min(100, Math.round((ml / target) * 100)) : 0;
  const done = ml >= target;

  const drink = (amount: number) => {
    setMl(addWater(amount));
    setSplash((n) => n + 1);
  };

  /* Cap the row so a 5 L target does not render forty tiny glasses; past the
     cap the count carries the rest. */
  const shown = Math.min(glassesNeeded, 12);

  return (
    <section className="panel p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-azure">
            <Icon name="water" size={18} />
          </span>
          <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
            {t("title")}
          </h2>
        </div>
        {done && (
          <span className="badge border-azure/40 text-azure">
            <Icon name="check" size={12} /> {t("done")}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <span
            key={splash}
            className="animate-count font-display text-4xl leading-none text-bone"
          >
            {formatWater(ml)}
          </span>
          <span className="ml-1.5 text-xs text-ash-dim">/ {formatWater(target)}</span>
        </div>
        <span className="font-condensed text-sm text-ash">{pct}%</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-line/60 bg-void">
        <div
          className="h-full rounded-full bg-gradient-to-r from-azure-deep to-azure transition-[width] duration-700 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* the glasses double as the log */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {Array.from({ length: shown }).map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`h-7 w-5 rounded-b-md rounded-t-sm border transition-colors duration-300 ${
              i < glassesDrunk
                ? "border-azure/60 bg-azure/30"
                : "border-line bg-void"
            }`}
          />
        ))}
        {glassesNeeded > shown && (
          <span className="self-center pl-1 text-xs text-ash-dim">
            +{glassesNeeded - shown}
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => drink(GLASS_ML)}
          className="btn btn-primary !py-2.5 text-xs"
        >
          + {t("glass")}
        </button>
        <button
          type="button"
          onClick={() => drink(500)}
          className="btn btn-ghost !py-2.5 text-xs"
        >
          + {t("bottle")}
        </button>
        <button
          type="button"
          onClick={() => drink(-GLASS_ML)}
          disabled={ml === 0}
          className="btn btn-ghost !py-2.5 text-xs disabled:opacity-40"
        >
          {t("undo")}
        </button>
        <button
          type="button"
          onClick={() => setMl(resetWaterToday())}
          disabled={ml === 0}
          className="btn btn-ghost !py-2.5 text-xs disabled:opacity-40"
        >
          {t("reset")}
        </button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ash-dim">
        {trainedToday() ? t("hintTrained") : t("hint")}
      </p>
    </section>
  );
}
