"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import {
  MICRO_KEYS,
  MICRO_SPECS,
  microCoverage,
  microTargets,
  sumMicros,
  type MicroKey,
} from "@/lib/nutrients";
import type { Meal } from "@/lib/tracking";
import type { Profile } from "@/lib/onboarding";

/* Minerals and vitamin C for the day.

   Two honesty rules are baked into this component and should stay:

   1. Coverage is stated out loud. Only scanned meals carry micronutrient data,
      so if three of your five meals were typed by hand the bars are reading a
      fraction of what you ate — saying "based on 40% of today's meals" is the
      difference between a useful hint and a lie.

   2. Sodium is drawn as a ceiling, not a goal. Filling it is bad. It gets the
      warning colour on the way up rather than the satisfying one. */

export function MicroPanel({ meals, profile }: { meals: Meal[]; profile: Profile | null }) {
  const t = useTranslations("micro");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totals = sumMicros(meals);
  const targets = microTargets(profile);
  const coverage = microCoverage(meals);
  const anyData = MICRO_KEYS.some((k) => (totals[k] ?? 0) > 0);

  return (
    <section className="panel p-6">
      <div className="mb-1 flex items-center gap-2.5">
        <span className="text-blood">
          <Icon name="nutrition" size={18} />
        </span>
        <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
          {t("title")}
        </h2>
      </div>
      <p className="text-xs leading-relaxed text-ash-dim">{t("estimateNote")}</p>

      {!anyData ? (
        <p className="mt-5 text-sm leading-relaxed text-ash">{t("empty")}</p>
      ) : (
        <>
          <ul className="mt-5 space-y-3.5">
            {MICRO_KEYS.map((key, i) => (
              <MicroBar
                key={key}
                mkey={key}
                label={t(key)}
                value={totals[key] ?? 0}
                target={targets[key]}
                delay={mounted ? i * 70 : 0}
                animate={mounted}
              />
            ))}
          </ul>

          {coverage < 100 && (
            <p className="mt-5 flex items-start gap-2 rounded-xl border border-line px-3.5 py-2.5 text-xs leading-relaxed text-ash">
              <span className="mt-0.5 shrink-0 text-ash-dim">
                <Icon name="clock" size={13} />
              </span>
              {t("coverage", { pct: coverage })}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function MicroBar({
  mkey,
  label,
  value,
  target,
  delay,
  animate,
}: {
  mkey: MicroKey;
  label: string;
  value: number;
  target: number;
  delay: number;
  animate: boolean;
}) {
  const isLimit = MICRO_SPECS[mkey].kind === "limit";
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const over = isLimit && value > target;

  /* A limit that is 80% full is already worth a warning colour; a target that
     is 80% full is nearly a success. Same number, opposite meaning. */
  const bar = over
    ? "bg-blood-bright"
    : isLimit
      ? pct > 80
        ? "bg-ember"
        : "bg-ash"
      : "bg-gradient-to-r from-blood to-ember";

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-bone/90">{label}</span>
        <span className={over ? "font-condensed text-blood-bright" : "font-condensed text-ash-dim"}>
          {Math.round(value)} {isLimit ? "/ max" : "/"} {target} mg
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full border border-line/60 bg-void">
        <div
          className={`h-full rounded-full ${bar} motion-reduce:transition-none`}
          style={{
            width: animate ? `${pct}%` : "0%",
            transition: `width 800ms cubic-bezier(.22,.9,.3,1) ${delay}ms`,
          }}
        />
      </div>
    </li>
  );
}
