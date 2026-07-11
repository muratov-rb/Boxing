"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { weekSchedule, dayKind, type DayKind } from "@/lib/session";

/* Rest & Recovery — surfaces the weekly split so rest days are a planned part
   of the program, not an afterthought. Today's kind drives the call-to-action:
   train / light recovery flow / full rest. */

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function RecoveryCard() {
  const t = useTranslations("recovery");
  const [todayIdx, setTodayIdx] = useState<number | null>(null);

  useEffect(() => {
    setTodayIdx(new Date().getDay());
  }, []);

  const week = weekSchedule();
  const kind: DayKind | null = todayIdx == null ? null : week[todayIdx].kind;
  const dayLetters = [
    t("dSun"),
    t("dMon"),
    t("dTue"),
    t("dWed"),
    t("dThu"),
    t("dFri"),
    t("dSat"),
  ];

  const dotClass = (k: DayKind, isToday: boolean) =>
    cx(
      "grid h-8 w-8 place-items-center rounded-full border text-[0.6rem] font-condensed uppercase transition-colors",
      k === "rest"
        ? "border-line bg-void text-ash-dim"
        : k === "active"
          ? "border-azure/50 text-azure"
          : "border-blood/50 text-blood",
      isToday && "ring-2 ring-bone font-bold",
    );

  return (
    <section className="panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-azure">
            <Icon name="rest" size={18} />
          </span>
          <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
            {t("title")}
          </h2>
        </div>
        {kind && (
          <span
            className={cx(
              "badge",
              kind === "rest"
                ? "text-ash-dim"
                : kind === "active"
                  ? "border-azure/50 text-azure"
                  : "border-blood/50 text-blood",
            )}
          >
            {t(`today_${kind}`)}
          </span>
        )}
      </div>

      {/* weekly strip */}
      <div className="flex items-center justify-between gap-1">
        {week.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className={dotClass(d.kind, todayIdx === i)}>{dayLetters[i]}</span>
            <span className="text-[0.55rem] uppercase tracking-wider text-ash-dim">
              {d.kind === "rest" ? t("legRest") : d.kind === "active" ? t("legActive") : ""}
            </span>
          </div>
        ))}
      </div>

      {/* today's guidance */}
      <p className="mt-4 text-sm text-ash">
        {kind === "rest"
          ? t("restBody")
          : kind === "active"
            ? t("activeBody")
            : t("trainBody")}
      </p>

      <ul className="mt-3 space-y-1.5">
        {[t("tip1"), t("tip2"), t("tip3")].map((tip, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-ash">
            <span className="mt-0.5 text-azure">
              <Icon name="check" size={13} />
            </span>
            {tip}
          </li>
        ))}
      </ul>

      {kind !== "rest" && (
        <Link href="/train" className="btn btn-ghost mt-5 w-full">
          {kind === "active" ? t("ctaActive") : t("ctaTrain")}
          <Icon name="arrow" size={16} />
        </Link>
      )}
    </section>
  );
}
