"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { requestAnalysis, type Analysis } from "@/lib/analysis";
import { RANKS, type Profile } from "@/lib/onboarding";
import { Icon } from "@/components/ui/Icons";
import { Belt } from "@/components/ui/Belt";

const LINE_COUNT = 5;

function FeasibilityRing({ value, label }: { value: number; label: string }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);
  const offset = mounted ? C * (1 - value / 100) : C;

  return (
    <div className="relative grid h-40 w-40 place-items-center">
      <svg viewBox="0 0 140 140" className="h-40 w-40 -rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-ember)" />
            <stop offset="1" stopColor="var(--color-blood)" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--color-line)" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.16,.84,.44,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="font-display text-4xl leading-none">{value}%</span>
        <span className="mt-1 block font-condensed text-[0.6rem] uppercase tracking-[0.2em] text-ash-dim">
          {label}
        </span>
      </div>
    </div>
  );
}

export function AnalysisReveal({
  profile,
  onReady,
  onBack,
  onNext,
}: {
  profile: Profile;
  onReady: (a: Analysis) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("analysis");
  const tonb = useTranslations("onb");
  const tg = useTranslations("goals");
  const tf = useTranslations("timeframes");
  const tenv = useTranslations("environments");
  const tna = useTranslations("nutritionAccess");
  const tr = useTranslations("ranks");
  const locale = useLocale();

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [line, setLine] = useState(0);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let alive = true;
    const timer = setInterval(
      () => setLine((l) => (l + 1) % LINE_COUNT),
      850,
    );
    Promise.all([
      requestAnalysis(profile, locale === "ru" ? "ru" : "en"),
      new Promise((r) => setTimeout(r, 1700)),
    ]).then((res) => {
      if (!alive) return;
      clearInterval(timer);
      const a = res[0] as Analysis;
      setAnalysis(a);
      onReadyRef.current(a);
    });
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [profile, locale]);

  const loadingLines = [t("load1"), t("load2"), t("load3"), t("load4"), t("load5")];

  /* ---------- loading ---------- */
  if (!analysis) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center text-center">
        <div className="animate-glow relative grid h-24 w-24 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full border border-blood/40" />
          <span className="text-blood">
            <Icon name="bolt" size={40} />
          </span>
        </div>
        <p className="mt-8 font-condensed text-sm uppercase tracking-[0.3em] text-ash">
          {t("analyzing")}
        </p>
        <p className="mt-2 font-display text-2xl uppercase text-bone">
          {loadingLines[line]}
        </p>
      </div>
    );
  }

  /* ---------- reveal ---------- */
  const goalsText = [
    ...profile.goals.map((id) => tg(`${id}L`)),
    ...(profile.customGoal.trim() ? [profile.customGoal.trim()] : []),
  ].join(" · ");
  const byText =
    profile.timeframe === "custom"
      ? profile.customTimeframe.trim()
      : profile.timeframe
        ? tf(`${profile.timeframe}L`)
        : "";
  const recap = [
    { k: t("recapGoals"), v: goalsText },
    { k: t("recapBy"), v: byText },
    { k: t("recapSetup"), v: profile.environment ? tenv(`${profile.environment}L`) : "" },
    { k: t("recapFuel"), v: profile.nutritionAccess ? tna(`${profile.nutritionAccess}L`) : "" },
  ].filter((r) => r.v);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="kicker justify-center">{t("round")}</p>

      {/* feasibility + summary */}
      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="animate-pop shrink-0">
          <FeasibilityRing value={analysis.feasibility} label={t("chance")} />
        </div>
        <div className="text-center sm:text-left">
          <h1 className="font-display text-[clamp(2rem,5vw,3rem)] uppercase leading-none text-blood">
            {analysis.verdict}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ash">{analysis.summary}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 font-condensed text-[0.6rem] uppercase tracking-[0.2em] text-ash-dim">
            <Icon name="bolt" size={11} />
            {analysis.source === "ai" ? t("claudeAnalysis") : t("coachEstimate")}
          </span>
        </div>
      </div>

      {/* recap chips */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {recap.map((r) => (
          <span key={r.k} className="badge">
            {r.k}: <span className="text-bone">{r.v}</span>
          </span>
        ))}
      </div>

      {/* belt unlocked */}
      <div className="panel mt-8 flex flex-col items-center gap-6 p-7 text-center sm:flex-row sm:text-left">
        <div className="shine w-full max-w-[220px] shrink-0">
          <Belt className="h-auto w-full" />
        </div>
        <div>
          <p className="font-condensed text-xs uppercase tracking-[0.3em] text-ash">
            {t("beltUnlocked")}
          </p>
          <h2 className="font-display text-4xl uppercase leading-none text-bone">
            {tr("0n")}
          </h2>
          <p className="mt-2 text-sm text-ash">
            {t("rankLine", {
              total: RANKS.length,
              top: tr(`${RANKS.length - 1}n`),
            })}
          </p>
        </div>
      </div>

      {/* roadmap */}
      <div className="mt-8">
        <h2 className="font-condensed text-lg font-bold uppercase tracking-wide">
          {t("roadmap")}
        </h2>
        <ol className="mt-4 space-y-3">
          {analysis.roadmap.map((phase, i) => (
            <li key={phase.label} className="panel flex gap-4 p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center bg-blood font-display text-lg text-white">
                {i + 1}
              </span>
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="font-condensed text-lg font-bold uppercase tracking-wide">
                    {phase.title}
                  </h3>
                  <span className="font-condensed text-xs uppercase tracking-wider text-ash-dim">
                    {phase.label}
                  </span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {phase.focus.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-bone/90">
                      <span className="mt-0.5 text-blood">
                        <Icon name="check" size={15} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* nutrition preview */}
      <div className="panel mt-6 p-6">
        <div className="flex items-center gap-2.5">
          <span className="text-blood">
            <Icon name="nutrition" size={18} />
          </span>
          <h2 className="font-condensed text-lg font-bold uppercase tracking-wide">
            {t("fuelPlan")}
          </h2>
        </div>
        <ul className="mt-4 space-y-2">
          {analysis.nutrition.map((n) => (
            <li key={n} className="flex items-start gap-2.5 text-sm text-bone/90">
              <span className="mt-0.5 text-blood">
                <Icon name="check" size={15} />
              </span>
              {n}
            </li>
          ))}
        </ul>
      </div>

      {/* cautions */}
      {analysis.cautions.length > 0 && (
        <div className="mt-6 border border-blood/40 bg-blood/5 p-6">
          <h2 className="font-condensed text-sm font-bold uppercase tracking-widest text-blood">
            {t("straightTalk")}
          </h2>
          <ul className="mt-3 space-y-2">
            {analysis.cautions.map((c) => (
              <li key={c} className="text-sm text-ash">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* nav */}
      <div className="mt-8 flex items-center justify-between">
        <button type="button" onClick={onBack} className="btn btn-ghost">
          {tonb("back")}
        </button>
        <button type="button" onClick={onNext} className="btn btn-primary shine">
          {t("enterGym")}
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
