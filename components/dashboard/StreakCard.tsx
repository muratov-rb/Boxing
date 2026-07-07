"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import {
  currentStreak,
  markTrainedToday,
  totalTrainedDays,
  trainedToday,
} from "@/lib/tracking";

/* Streak — consecutive training days, logged locally with one tap. */

export function StreakCard() {
  const t = useTranslations("track");
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [doneToday, setDoneToday] = useState(false);

  useEffect(() => {
    setStreak(currentStreak());
    setTotal(totalTrainedDays());
    setDoneToday(trainedToday());
  }, []);

  const mark = () => {
    markTrainedToday();
    setStreak(currentStreak());
    setTotal(totalTrainedDays());
    setDoneToday(true);
  };

  return (
    <section className="panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-blood">
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
        <div>
          <span className="font-display text-5xl leading-none">{streak}</span>
          <span className="ml-2 font-condensed text-sm uppercase tracking-wider text-ash">
            {t("days")}
          </span>
        </div>
        <span
          className={`grid h-12 w-12 place-items-center rounded-full ${
            streak > 0 ? "animate-glow text-blood" : "text-ash-dim"
          }`}
        >
          <Icon name="streak" size={30} />
        </span>
      </div>

      <button
        type="button"
        onClick={mark}
        disabled={doneToday}
        className="btn btn-primary mt-5 w-full"
      >
        {doneToday ? (
          <>
            <Icon name="check" size={16} /> {t("doneToday")}
          </>
        ) : (
          t("markToday")
        )}
      </button>
      <p className="mt-2 text-xs text-ash-dim">{t("streakHint")}</p>
    </section>
  );
}
