"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { RANKS, hasBag, hasWeights, type Profile } from "@/lib/onboarding";
import { localAnalysis, type Analysis } from "@/lib/analysis";
import { Icon } from "@/components/ui/Icons";
import type { IconName } from "@/components/ui/Icons";

function buildSession(profile: Profile): { key: string; mins: number }[] {
  const bag = hasBag(profile);
  const weights = hasWeights(profile);
  if (profile.path === "experienced") {
    return [
      { key: "ropeMobility", mins: 8 },
      { key: bag ? "bagCombos" : "shadowCombos", mins: 18 },
      { key: "slipsRolls", mins: 15 },
      { key: weights ? "powerStrength" : "explosiveBw", mins: 12 },
      { key: "cooldown", mins: 5 },
    ];
  }
  return [
    { key: "shadowWarmup", mins: 8 },
    { key: "stanceGuard", mins: 12 },
    { key: bag ? "jabCrossBag" : "jabCrossShadow", mins: 15 },
    { key: weights ? "weightedCond" : "bodyweightCond", mins: 10 },
    { key: "cooldown", mins: 5 },
  ];
}

export function DashboardPreview({
  profile,
  analysis,
  onRestart,
}: {
  profile: Profile;
  analysis: Analysis | null;
  onRestart: () => void;
}) {
  const t = useTranslations("dash");
  const tr = useTranslations("ranks");
  const tg = useTranslations("goals");
  const tf = useTranslations("timeframes");
  const tp = useTranslations("paths");
  const tses = useTranslations("session");
  const locale = useLocale();

  const a = analysis ?? localAnalysis(profile, locale === "ru" ? "ru" : "en");
  const pathId = profile.path ?? "beginner";
  const rank0 = tr("0n");
  const session = buildSession(profile);
  const totalMins = session.reduce((s, r) => s + r.mins, 0);
  const goalsT = profile.goals.map((id) => tg(`${id}L`));

  const goalText =
    profile.goals.includes("lose_fat") && profile.targetWeight
      ? `${profile.weight || "?"} → ${profile.targetWeight} ${profile.weightUnit}`
      : (goalsT[0] ?? tg("get_fitL"));
  const byText =
    profile.timeframe === "custom"
      ? profile.customTimeframe.trim()
      : profile.timeframe
        ? tf(`${profile.timeframe}L`)
        : "";

  function PreviewTag() {
    return (
      <span className="inline-flex items-center gap-1 font-condensed text-[0.6rem] uppercase tracking-[0.2em] text-ash-dim">
        <Icon name="lock" size={10} /> {t("previewTag")}
      </span>
    );
  }

  function Card({
    title,
    icon,
    children,
    className = "",
  }: {
    title: string;
    icon: IconName;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <section className={`panel p-6 ${className}`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-blood">
              <Icon name={icon} size={18} />
            </span>
            <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
              {title}
            </h2>
          </div>
          <PreviewTag />
        </div>
        {children}
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* not-live banner */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-blood/40 bg-blood/5 px-4 py-3">
        <span className="text-blood">
          <Icon name="lock" size={18} />
        </span>
        <p className="text-sm text-ash">
          <span className="font-semibold text-bone">{t("previewBold")}</span>{" "}
          {t("previewRest")}
        </p>
      </div>

      {/* greeting */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker">{t("welcome")}</p>
          <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
            {t("dayOnePre")}
            <span className="text-blood">{rank0}.</span>
          </h1>
          <p className="mt-2 text-ash">
            {tp(`${pathId}Label`)} · {goalsT.slice(0, 3).join(", ")} · {t("by")}{" "}
            {byText || "—"}
          </p>
        </div>
        <span className="badge border-blood/40 text-blood">
          <Icon name="belt" size={13} />{" "}
          {t("rankBadge", { rank: rank0, total: RANKS.length })}
        </span>
      </header>

      {/* rank ladder */}
      <Card title={t("climb")} icon="belt" className="mt-6">
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max items-stretch gap-2 px-1">
            {RANKS.map((r, i) => {
              const current = i === 0;
              return (
                <div
                  key={r.name}
                  className={[
                    "flex w-28 shrink-0 flex-col rounded-xl border p-3",
                    current
                      ? "border-blood bg-surface-2 shadow-[0_0_30px_-10px_rgba(224,16,41,0.6)]"
                      : "border-line",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "font-condensed text-[0.6rem] uppercase tracking-widest",
                      current ? "text-blood" : "text-ash-dim",
                    ].join(" ")}
                  >
                    {t("rankN", { n: i + 1 })}
                  </span>
                  <span
                    className={[
                      "mt-1 font-condensed text-sm font-bold uppercase leading-tight",
                      current ? "text-bone" : "text-ash",
                    ].join(" ")}
                  >
                    {tr(`${i}n`)}
                  </span>
                  <span className="mt-1 text-[0.65rem] leading-tight text-ash-dim">
                    {current ? t("youStartHere") : tr(`${i}t`)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* today's session */}
        <Card title={t("todaySession")} icon="plan" className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between text-sm text-ash">
            <span>{t("rounds", { count: session.length })}</span>
            <span className="font-condensed uppercase tracking-wider">
              {t("min", { mins: totalMins })}
            </span>
          </div>
          <ol className="divide-y divide-line/70">
            {session.map((r, i) => (
              <li key={r.key} className="flex items-center justify-between py-3">
                <span className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-lg border border-line font-condensed text-xs text-ash-dim">
                    {i + 1}
                  </span>
                  <span className="text-sm text-bone/90">{tses(r.key)}</span>
                </span>
                <span className="font-condensed text-sm text-ash">{r.mins}m</span>
              </li>
            ))}
          </ol>
          <Link href="/train" className="btn btn-primary shine mt-5 w-full">
            <Icon name="bolt" size={16} /> {t("startSession")}
          </Link>
        </Card>

        {/* side column */}
        <div className="grid gap-4">
          <Card title={t("coachRead")} icon="target">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl">{a.feasibility}%</span>
              <span className="text-xs text-ash-dim">{a.verdict}</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden bg-void">
              <div
                className="h-full bg-gradient-to-r from-blood to-ember"
                style={{ width: `${a.feasibility}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-ash-dim">{t("coachReadSub")}</p>
          </Card>

          <Card title={t("goalProgress")} icon="target">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl">3%</span>
              <span className="text-xs text-ash-dim">{goalText}</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden bg-void">
              <div className="h-full bg-gradient-to-r from-blood to-ember" style={{ width: "3%" }} />
            </div>
            <p className="mt-2 text-xs text-ash-dim">{t("fills")}</p>
          </Card>

          <Card title={t("streak")} icon="streak">
            <div className="flex items-center justify-between">
              <span className="font-display text-3xl">0</span>
              <span className="text-sm text-ash">{t("days")}</span>
            </div>
            <p className="mt-2 text-xs text-ash-dim">{t("streakSub")}</p>
          </Card>
        </div>
      </div>

      {/* roadmap + nutrition */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title={t("roadmap")} icon="plan">
          <ol className="space-y-3">
            {a.roadmap.map((phase, i) => (
              <li key={phase.label} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center border border-line font-condensed text-xs text-ash-dim">
                  {i + 1}
                </span>
                <span className="flex-1">
                  <span className="font-condensed text-sm font-semibold uppercase tracking-wide">
                    {phase.title}
                  </span>
                  <span className="ml-2 text-xs text-ash-dim">{phase.label}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>

        <Card title={t("nutrition")} icon="nutrition">
          <ul className="space-y-2">
            {a.nutrition.slice(0, 4).map((n) => (
              <li key={n} className="flex items-start gap-2.5 text-sm text-bone/90">
                <span className="mt-0.5 text-blood">
                  <Icon name="check" size={15} />
                </span>
                {n}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ash-dim">{t("nutritionSub")}</p>
        </Card>
      </div>

      {/* actions */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-line/70 pt-6 sm:flex-row">
        <p className="text-sm text-ash-dim">{t("actionsNote")}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onRestart} className="btn btn-ghost">
            {t("startOver")}
          </button>
          <Link href="/register" className="btn btn-primary">
            {t("createAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}
