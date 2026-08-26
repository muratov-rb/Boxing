"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { availableCircuits, circuitMinutes, type Circuit } from "@/lib/circuits";
import { loadProfile } from "@/lib/tracking";
import { rankFromXp } from "@/lib/xp";
import { currentXp } from "@/lib/tracking";

/* The way into /circuits from where people already are.

   A page nobody links to may as well not exist, and this one was reachable
   only from the account menu. It shows up after the daily session and in the
   lesson library, but only once there is some reason to think the reader can
   use it — circuits assume the movements are already known, and offering
   "Death by Burpees" to somebody on day one is how you lose them.

   The bar is either declaring experience at onboarding or having earned a few
   ranks, so it opens for people who arrived as beginners and got good. */

const RANK_GATE = 2;

export function CircuitTeaser() {
  const t = useTranslations("circuits");
  const locale = useLocale();
  const li = locale === "ru" ? 1 : 0;
  const [pick, setPick] = useState<Circuit | null>(null);

  useEffect(() => {
    const profile = loadProfile();
    const earned = rankFromXp(currentXp()) >= RANK_GATE;
    if (profile?.path !== "experienced" && !earned) return;

    /* Suggest something they can actually do today: filtered by their kit,
       then the hardest they have unlocked, so the teaser is not always the
       same beginner circuit. */
    const list = availableCircuits(profile);
    if (list.length === 0) return;
    const ceiling = earned && profile?.path !== "experienced" ? 2 : 3;
    const fits = list.filter((x) => x.level <= ceiling);
    const day = Math.floor(Date.now() / 86_400_000);
    const pool = fits.length ? fits : list;
    setPick(pool[day % pool.length]);
  }, []);

  if (!pick) return null;

  return (
    <Link
      href="/circuits"
      className="panel group flex items-center justify-between gap-4 p-5 transition-colors hover:border-blood/40"
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-blood">
            <Icon name="streak" size={16} />
          </span>
          <span className="font-condensed text-xs uppercase tracking-widest text-ash">
            {t("teaserKicker")}
          </span>
        </span>
        <span className="mt-1.5 block font-display text-xl uppercase leading-none">
          {pick.name[li]}
        </span>
        <span className="mt-1 block text-sm text-ash">
          {t("teaserSub", { min: circuitMinutes(pick) })}
        </span>
      </span>
      <span className="shrink-0 text-ash-dim transition-transform group-hover:translate-x-0.5 group-hover:text-blood">
        <Icon name="arrow" size={18} />
      </span>
    </Link>
  );
}
