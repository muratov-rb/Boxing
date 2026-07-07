"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { EXERCISES, filterExercises, type Exercise } from "@/lib/exercises";
import { loadProfile, markTrainedToday } from "@/lib/tracking";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { Icon } from "@/components/ui/Icons";
import { BodyMap } from "@/components/lessons/BodyMap";
import { Exercise3D } from "@/components/lessons/Exercise3D";

/* ===========================================================================
   TrainClient — the guided session player.
   Builds a workout from the saved profile, then runs it on real timers:
   Start → work countdown (exercise's own workSec) → short rest → next.
   Finishing logs the day to the streak.
   =========================================================================== */

const REST_SEC = 15;

/* pick a varied session from what the user can actually do */
function buildSession(all: Exercise[]): Exercise[] {
  const by = (f: (e: Exercise) => boolean) => all.filter(f);
  const picked: Exercise[] = [];
  const take = (pool: Exercise[], n: number) => {
    for (const e of pool) {
      if (picked.length >= 8) break;
      if (n <= 0) break;
      if (!picked.includes(e)) {
        picked.push(e);
        n--;
      }
    }
  };

  take(by((e) => e.bodyPart === "fullbody" && e.level === 1), 1); // warm-up
  take(by((e) => e.bodyPart === "technique"), 2); // boxing skill block
  take(by((e) => ["chest", "arms", "shoulders", "back"].includes(e.bodyPart)), 2);
  take(by((e) => e.bodyPart === "legs"), 1);
  take(by((e) => e.bodyPart === "core"), 1);
  if (picked.length < 4) take(all, 4 - picked.length); // sparse setups
  return picked;
}

type Phase = "idle" | "work" | "rest" | "done";

export function TrainClient() {
  const t = useTranslations("train");
  const locale = useLocale() === "ru" ? "ru" : "en";

  const [session, setSession] = useState<Exercise[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [workedSec, setWorkedSec] = useState(0);
  const streakDone = useRef(false);

  /* build the session once from the saved profile */
  useEffect(() => {
    const p = loadProfile();
    const pool = p?.environment ? filterExercises(p) : EXERCISES;
    setUsedFallback(!p?.environment);
    setSession(buildSession(pool));
  }, []);

  const totalSec = useMemo(
    () => session.reduce((s, e) => s + e.workSec, 0) + Math.max(0, session.length - 1) * REST_SEC,
    [session],
  );
  const estKcal = useMemo(
    () => Math.round(session.reduce((s, e) => s + (e.workSec / 600) * e.kcal10min, 0)),
    [session],
  );

  /* the clock */
  useEffect(() => {
    if (phase !== "work" && phase !== "rest") return;
    if (paused) return;
    const id = setInterval(() => {
      setRemaining((r) => r - 1);
      if (phase === "work") setWorkedSec((w) => w + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [phase, paused]);

  /* phase transitions when the countdown hits zero */
  useEffect(() => {
    if (remaining > 0) return;
    if (phase === "work") {
      if (idx + 1 >= session.length) {
        setPhase("done");
      } else {
        setPhase("rest");
        setRemaining(REST_SEC);
      }
    } else if (phase === "rest") {
      setIdx((i) => i + 1);
      setPhase("work");
      setRemaining(session[idx + 1]?.workSec ?? 45);
    }
  }, [remaining, phase, idx, session]);

  /* log the streak exactly once on completion */
  useEffect(() => {
    if (phase === "done" && !streakDone.current) {
      streakDone.current = true;
      markTrainedToday();
    }
  }, [phase]);

  const start = () => {
    if (session.length === 0) return;
    setIdx(0);
    setWorkedSec(0);
    setPaused(false);
    setPhase("work");
    setRemaining(session[0].workSec);
  };

  const skip = () => {
    if (phase === "work" || phase === "rest") setRemaining(0);
  };

  const quit = () => {
    setPhase("idle");
    setPaused(false);
  };

  const current = session[idx];
  const next = session[idx + 1];
  const shown = phase === "rest" && next ? next : current;
  const phaseTotal = phase === "rest" ? REST_SEC : (current?.workSec ?? 1);
  const pct = phase === "work" || phase === "rest"
    ? Math.max(0, Math.min(100, Math.round(((phaseTotal - remaining) / phaseTotal) * 100)))
    : 0;

  const mmss = (s: number) =>
    `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* top bar */}
      <header className="sticky top-0 z-50 border-b border-line/70 bg-void/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-3">
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

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        {/* ------------------------------ overview ------------------------------ */}
        {phase === "idle" && (
          <div className="animate-rise">
            <p className="kicker">{t("kicker")}</p>
            <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
              {t("titlePre")}
              <span className="text-blood">{t("titleAccent")}</span>
            </h1>
            <p className="mt-3 max-w-xl text-ash">{t("sub")}</p>
            {usedFallback && (
              <p className="mt-2 text-xs text-ash-dim">{t("noExercises")}</p>
            )}

            <div className="panel mt-8 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="badge border-blood/40 text-blood">
                  {t("meta", { n: session.length, min: Math.round(totalSec / 60) })}
                </span>
                <span className="badge">~{estKcal} kcal</span>
              </div>
              <ol className="divide-y divide-line/70">
                {session.map((e, i) => (
                  <li key={e.id} className="flex items-center justify-between py-3">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-line font-condensed text-xs text-ash-dim">
                        {i + 1}
                      </span>
                      <span className="truncate text-sm text-bone/90">
                        {e.name[locale]}
                      </span>
                    </span>
                    <span className="font-condensed text-sm text-ash">
                      {mmss(e.workSec)}
                    </span>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={start}
                disabled={session.length === 0}
                className="btn btn-primary shine mt-6 w-full"
              >
                {t("start")}
                <Icon name="bolt" size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------ live player --------------------------- */}
        {(phase === "work" || phase === "rest") && shown && (
          <div className="animate-rise">
            <div className="flex items-center justify-between">
              <span className="badge">
                {t("exOf", { i: Math.min(idx + 1, session.length), n: session.length })}
              </span>
              <span
                className={`badge ${phase === "rest" ? "border-azure/50 text-azure" : "border-blood/50 text-blood"}`}
              >
                {phase === "rest" ? t("rest") : shown.dose[locale]}
              </span>
            </div>

            <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,3rem)] uppercase leading-none">
              {phase === "rest" && (
                <span className="mr-3 text-ash">{t("nextUp")}:</span>
              )}
              <span className={phase === "rest" ? "text-azure" : "text-blood"}>
                {shown.name[locale]}
              </span>
            </h1>

            {/* countdown + progress */}
            <div className="mt-5 flex items-end justify-between">
              <span className="font-display text-[clamp(3.5rem,12vw,6rem)] leading-none tabular-nums">
                {mmss(remaining)}
              </span>
              {paused && (
                <span className="badge border-blood/50 text-blood">{t("pause")}</span>
              )}
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full border border-line/60 bg-void">
              <div
                className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
                  phase === "rest" ? "bg-azure" : "bg-gradient-to-r from-blood to-ember"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* 3D coach + cues */}
            <div className="mt-6 grid gap-4 sm:grid-cols-5">
              <div className="sm:col-span-3">
                <div className="overflow-hidden rounded-lg border border-line/70 bg-void/40">
                  <Exercise3D preset={shown.demo} className="h-64 w-full sm:h-80" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="rounded-lg border border-line/70 bg-void/40 p-3">
                  <BodyMap muscles={shown.muscles} className="h-auto w-full" />
                </div>
                <ul className="mt-3 space-y-1.5">
                  {shown.steps[locale].slice(0, 3).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-ash">
                      <span className="mt-0.5 text-blood">
                        <Icon name="check" size={13} />
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* controls */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="btn btn-primary"
              >
                {paused ? t("resume") : t("pause")}
              </button>
              <button type="button" onClick={skip} className="btn btn-ghost">
                {t("skip")}
                <Icon name="arrow" size={16} />
              </button>
              <button type="button" onClick={quit} className="btn btn-ghost">
                {t("quit")}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------ finished ------------------------------ */}
        {phase === "done" && (
          <div className="animate-pop mx-auto max-w-lg text-center">
            <div className="animate-glow mx-auto grid h-20 w-20 place-items-center rounded-full border border-blood/50 text-blood">
              <Icon name="belt" size={38} />
            </div>
            <h1 className="mt-6 font-display text-[clamp(2.2rem,7vw,3.5rem)] uppercase leading-none">
              {t("doneTitle")}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-ash">{t("doneSub")}</p>

            <div className="panel mt-8 grid grid-cols-3 divide-x divide-line/70 p-5">
              <div>
                <p className="font-display text-3xl">{Math.max(1, Math.round(workedSec / 60))}</p>
                <p className="mt-1 font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                  {t("statMin")}
                </p>
              </div>
              <div>
                <p className="font-display text-3xl">
                  {Math.round((workedSec / 600) * (estKcal / (totalSec / 600) || 0)) || estKcal}
                </p>
                <p className="mt-1 font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                  {t("statKcal")}
                </p>
              </div>
              <div>
                <p className="font-display text-3xl">{session.length}</p>
                <p className="mt-1 font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                  {t("statEx")}
                </p>
              </div>
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-ash">
              <span className="text-blood">
                <Icon name="streak" size={16} />
              </span>
              {t("streakMarked")}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-2">
              <button type="button" onClick={start} className="btn btn-ghost">
                {t("again")}
              </button>
              <Link href="/dashboard" className="btn btn-primary">
                {t("backDash")}
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
