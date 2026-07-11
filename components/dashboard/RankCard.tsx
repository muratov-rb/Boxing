"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { Celebration } from "./Celebration";
import { LockedFeature } from "./LockedFeature";
import { rankProgress, consumeRankUp, RANK_XP, entitlements } from "@/lib/tracking";

/* Rank — earned from XP (training + daily use), shown with a progress bar to
   the next tier. Climbing a rank fires a celebration; slipping shows a quiet
   note (XP decays when the fighter goes quiet). */

export function RankCard() {
  const t = useTranslations("track");
  const tr = useTranslations("ranks");
  const tp = useTranslations("plans");
  const [prog, setProg] = useState<ReturnType<typeof rankProgress> | null>(null);
  const [rankedUp, setRankedUp] = useState<number | null>(null);
  const [locked, setLocked] = useState<boolean | null>(null);

  useEffect(() => {
    if (!entitlements().ranks) {
      setLocked(true);
      return;
    }
    setLocked(false);
    setProg(rankProgress());
    const up = consumeRankUp(); // celebrate only a genuine climb
    if (up !== null) setRankedUp(up);
  }, []);

  if (locked)
    return (
      <LockedFeature icon="belt" title={tp("f_ranks")} body={tp("lockedRanks")} />
    );

  const idx = prog?.rankIndex ?? 0;
  const epicRank = idx >= 8; // Champion and above
  const nameOf = (i: number) => tr(`${Math.max(0, Math.min(RANK_XP.length - 1, i))}n`);

  return (
    <>
      <section className="panel relative overflow-hidden p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-blood">
              <Icon name="belt" size={18} />
            </span>
            <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
              {t("rankTitle")}
            </h2>
          </div>
          <span className="font-condensed text-[0.65rem] uppercase tracking-[0.2em] text-ash-dim">
            {t("rankOf", { n: idx + 1, total: RANK_XP.length })}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="font-display text-3xl uppercase leading-none">{nameOf(idx)}</p>
            <p className="mt-1 text-xs text-ash">{tr(`${idx}t`)}</p>
          </div>
          <span className="font-condensed text-sm text-ash-dim">
            {prog?.xp ?? 0} {t("xpLabel")}
          </span>
        </div>

        {/* progress to next rank */}
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full border border-line/60 bg-void">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blood to-ember transition-[width] duration-700 ease-out"
            style={{ width: `${prog?.pctToNext ?? 0}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ash-dim">
          {prog?.atMax
            ? t("maxRank")
            : t("xpToNext", { n: prog?.toNext ?? 0, rank: nameOf(idx + 1) })}
        </p>
      </section>

      {rankedUp !== null && (
        <Celebration
          open
          icon="belt"
          epic={epicRank}
          title={t("rankUpTitle")}
          body={t("rankUpBody", { rank: nameOf(rankedUp) })}
          cta={t("celebrateCta")}
          onClose={() => setRankedUp(null)}
        />
      )}
    </>
  );
}
