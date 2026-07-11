"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { TECHNIQUES } from "@/lib/technique";
import { dailyLimit, bumpUsage, type LimitState } from "@/lib/tracking";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { Icon } from "@/components/ui/Icons";
import { Exercise3D } from "@/components/lessons/Exercise3D";
import { TechniqueAnalyzer } from "./TechniqueAnalyzer";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function TechniqueClient() {
  const t = useTranslations("tech");
  const tp = useTranslations("plans");
  const locale = useLocale() === "ru" ? "ru" : "en";

  const [activeId, setActiveId] = useState(TECHNIQUES[0].id);
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [limit, setLimit] = useState<LimitState | null>(null);

  useEffect(() => {
    setLimit(dailyLimit("techniqueVideo"));
  }, []);

  const metered = !!limit && Number.isFinite(limit.limit);
  const reviewOk = !limit || limit.ok;

  const tech = useMemo(
    () => TECHNIQUES.find((x) => x.id === activeId) ?? TECHNIQUES[0],
    [activeId],
  );

  const select = (id: string) => {
    setActiveId(id);
    setTicked({}); // fresh checklist per technique
  };
  const toggle = (i: number) =>
    setTicked((prev) => ({ ...prev, [`${activeId}-${i}`]: !prev[`${activeId}-${i}`] }));

  const doneCount = tech.checklist.filter((_, i) => ticked[`${activeId}-${i}`]).length;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-void/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LocaleSwitcher />
            <Link
              href="/dashboard"
              className="font-condensed text-sm uppercase tracking-widest text-ash transition-colors hover:text-bone"
            >
              {t("backDash")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
          {t("titlePre")}
          <span className="text-blood">{t("titleAccent")}</span>
        </h1>
        <p className="mt-3 max-w-xl text-ash">{t("sub")}</p>

        {/* technique selector */}
        <div className="mt-8 flex flex-wrap gap-2">
          {TECHNIQUES.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={x.id === activeId}
              onClick={() => select(x.id)}
              className={cx(
                "badge transition-colors",
                x.id === activeId && "!border-blood !text-blood",
              )}
            >
              {x.name[locale]}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          {/* 3D reference */}
          <div className="min-w-0 lg:col-span-2">
            <div className="overflow-hidden rounded-[20px] border border-line/70 bg-void/40">
              <Exercise3D key={tech.demo} preset={tech.demo} className="h-64 w-full sm:h-72" />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ash-dim">
              <Icon name="target" size={12} /> {t("dragHint")}
            </p>
          </div>

          {/* checklist */}
          <div className="min-w-0 lg:col-span-3">
            <div className="panel p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-condensed text-xl font-bold uppercase tracking-wide">
                    {tech.name[locale]}
                  </h2>
                  <p className="mt-1 text-sm text-ash">{tech.cue[locale]}</p>
                </div>
                <span className="badge shrink-0">
                  {doneCount}/{tech.checklist.length}
                </span>
              </div>

              <ul className="mt-5 space-y-2">
                {tech.checklist.map((c, i) => {
                  const on = !!ticked[`${activeId}-${i}`];
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => toggle(i)}
                        className={cx(
                          "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                          on
                            ? "border-blood/60 bg-blood/5"
                            : "border-line hover:border-blood/40",
                        )}
                      >
                        <span
                          className={cx(
                            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                            on ? "border-blood bg-blood text-white" : "border-line text-transparent",
                          )}
                        >
                          <Icon name="check" size={13} />
                        </span>
                        <span className={cx("text-sm", on ? "text-bone" : "text-bone/90")}>
                          {c[locale]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {reviewOk ? (
                <button
                  type="button"
                  onClick={() => setAnalyzing(true)}
                  className="btn btn-primary shine mt-6 w-full"
                >
                  <Icon name="video" size={17} /> {t("getFeedback")}
                </button>
              ) : (
                <Link href="/plans" className="btn btn-ghost mt-6 w-full">
                  <Icon name="lock" size={15} />{" "}
                  {limit?.locked ? tp("f_technique") : tp("limitReached")}
                </Link>
              )}
              <p className="mt-2 text-center text-xs text-ash-dim">
                {metered && limit
                  ? tp("videosToday", { used: limit.used, limit: limit.limit })
                  : t("feedbackHint")}
              </p>
            </div>
          </div>
        </div>
      </main>

      {analyzing && (
        <TechniqueAnalyzer
          techniqueId={tech.id}
          techniqueName={tech.name[locale]}
          onAnalyzed={() => {
            bumpUsage("techniqueVideo"); // a completed review spends one of today's quota
            setLimit(dailyLimit("techniqueVideo"));
          }}
          onClose={() => setAnalyzing(false)}
        />
      )}
    </div>
  );
}
