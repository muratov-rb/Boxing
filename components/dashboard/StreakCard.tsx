"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { Celebration } from "./Celebration";
import {
  registerVisit,
  bestUsageStreak,
  totalUsageDays,
  milestoneFor,
  isEpicMilestone,
} from "@/lib/tracking";

/* Streak — consecutive days the fighter opens RingBornn. Auto-counts on load
   (Duolingo-style); hitting a milestone fires a celebration, with an extra-big
   one at 100 / 150 / 250+. */

const K_MILESTONE_SEEN = "pressure.streakMilestoneSeen";

export function StreakCard() {
  const t = useTranslations("track");
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [total, setTotal] = useState(0);
  const [countedToday, setCountedToday] = useState(false);
  const [celebrate, setCelebrate] = useState<{ n: number; epic: boolean } | null>(null);

  useEffect(() => {
    const s = registerVisit(); // records today + returns the live streak
    setStreak(s);
    setBest(bestUsageStreak());
    setTotal(totalUsageDays());
    setCountedToday(true);

    // celebrate a milestone once per streak value reached
    const milestone = milestoneFor(s);
    if (milestone !== null) {
      let seen = -1;
      try {
        seen = Number(localStorage.getItem(K_MILESTONE_SEEN) ?? "-1");
      } catch {
        /* ignore */
      }
      if (seen !== milestone) {
        try {
          localStorage.setItem(K_MILESTONE_SEEN, String(milestone));
        } catch {
          /* ignore */
        }
        setCelebrate({ n: milestone, epic: isEpicMilestone(milestone) });
      }
    }
  }, []);

  const lit = streak > 0;

  return (
    <>
      <section className="panel relative overflow-hidden p-6">
        {/* ambient embers when the streak is alive */}
        {lit && (
          <div className="pointer-events-none absolute right-5 top-4 h-16 w-16" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="animate-ember absolute bottom-0 rounded-full bg-ember"
                style={{
                  left: `${20 + i * 22}%`,
                  width: 4 - i * 0.6,
                  height: 4 - i * 0.6,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={lit ? "animate-flicker text-blood" : "text-ash-dim"}>
              <Icon name="streak" size={18} />
            </span>
            <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
              {t("streakTitle")}
            </h2>
          </div>
          <span className="font-condensed text-[0.65rem] uppercase tracking-[0.2em] text-ash-dim">
            {t("totalDays", { n: total })}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex items-end gap-2">
            <span
              key={streak}
              className="animate-count font-display text-6xl leading-none"
            >
              {streak}
            </span>
            <span className="mb-1 font-condensed text-sm uppercase tracking-wider text-ash">
              {streak === 1 ? t("day") : t("days")}
            </span>
          </div>
          <span
            className={`grid h-14 w-14 place-items-center rounded-full ${
              lit ? "animate-flicker text-blood" : "text-ash-dim"
            }`}
          >
            <Icon name="streak" size={34} />
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3">
          <span className="flex items-center gap-1.5 font-condensed text-xs uppercase tracking-widest text-ash-dim">
            <Icon name="belt" size={12} /> {t("best", { n: best })}
          </span>
          {countedToday && lit && (
            <span className="flex items-center gap-1 font-condensed text-xs uppercase tracking-widest text-blood">
              <Icon name="check" size={12} /> +1
            </span>
          )}
        </div>

        <p className="mt-3 text-xs text-ash-dim">
          {lit ? t("streakOnHint") : t("streakOffHint")}
        </p>
      </section>

      {celebrate && (
        <Celebration
          open
          icon="streak"
          epic={celebrate.epic}
          title={t("milestoneTitle", { n: celebrate.n })}
          body={
            celebrate.epic
              ? t("epicBody", { n: celebrate.n })
              : t("milestoneBody", { n: celebrate.n })
          }
          cta={t("celebrateCta")}
          onClose={() => setCelebrate(null)}
        />
      )}
    </>
  );
}
