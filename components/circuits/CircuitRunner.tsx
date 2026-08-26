"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { chime, primeAudio, setSoundEnabled, soundEnabled } from "@/lib/chime";
import { EXERCISES } from "@/lib/exercises";
import { awardXp, addBurned, markTrainedToday } from "@/lib/tracking";
import type { Circuit } from "@/lib/circuits";

/* The clock that actually runs a circuit.

   Three formats, one component, because they differ only in what the clock
   counts and what the finish condition is:

     amrap    — counts DOWN from the window; you tap off rounds; time ends it
     fortime  — counts UP to a cap; you end it by finishing
     interval — alternates work and rest for a fixed number of rounds

   Elapsed time is derived from a wall-clock start rather than accumulated by
   the interval, because setInterval drifts and is throttled hard in a
   background tab — a fighter who locks their phone mid-round would otherwise
   come back to a timer that had quietly lost a minute. */

type Phase = "idle" | "work" | "rest" | "done";

const mmss = (s: number) => {
  const v = Math.max(0, Math.ceil(s));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
};

export function CircuitRunner({ circuit }: { circuit: Circuit }) {
  const t = useTranslations("circuits");
  const locale = useLocale();
  const li = locale === "ru" ? 1 : 0;

  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [rounds, setRounds] = useState(0); // amrap: rounds the user tapped off
  const [soundOn, setSoundOn] = useState(true);

  /* Wall-clock anchors. Refs, not state: the ticker reads them every 200 ms
     and re-rendering on each write would be pointless work. */
  const startedAt = useRef(0);
  const phaseStartedAt = useRef(0);
  const pausedFor = useRef(0);
  const pausedAt = useRef(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => setSoundOn(soundEnabled()), []);

  const spec = circuit.timer;
  const totalSec = (spec.minutes ?? 0) * 60;
  const workSec = spec.workSec ?? 0;
  const restSec = spec.restSec ?? 0;
  const totalRounds = spec.rounds ?? 0;

  const now = () => Date.now() - pausedFor.current;

  const finish = useCallback(
    (completed: boolean) => {
      setPhase("done");
      chime("done");
      if (completed) {
        markTrainedToday();
        awardXp("workout");
        /* A rough burn: circuits sit around 10 kcal/min for this kind of
           work. Deliberately conservative — an overstated burn hands people
           calories they did not earn. */
        addBurned(Math.round((elapsed / 60) * 10));
      }
    },
    [elapsed],
  );

  /* the ticker */
  useEffect(() => {
    if (phase !== "work" && phase !== "rest") return;
    if (paused) return;

    const id = setInterval(() => {
      const total = (now() - startedAt.current) / 1000;
      setElapsed(total);

      if (spec.mode === "amrap" || spec.mode === "fortime") {
        if (total >= totalSec) finish(spec.mode === "amrap");
        return;
      }

      // interval: work/rest alternation
      const inPhase = (now() - phaseStartedAt.current) / 1000;
      const limit = phase === "work" ? workSec : restSec;
      if (inPhase < limit) return;

      if (phase === "work") {
        const last = round + 1 >= totalRounds;
        if (last) {
          finish(true);
          return;
        }
        if (restSec > 0) {
          setPhase("rest");
          phaseStartedAt.current = now();
          chime("rest");
        } else {
          setRound((r) => r + 1);
          phaseStartedAt.current = now();
          chime("work");
        }
      } else {
        setRound((r) => r + 1);
        setPhase("work");
        phaseStartedAt.current = now();
        chime("work");
      }
    }, 200);

    return () => clearInterval(id);
  }, [phase, paused, spec.mode, totalSec, workSec, restSec, totalRounds, round, finish]);

  const begin = () => {
    primeAudio();
    const t0 = Date.now();
    pausedFor.current = 0;
    startedAt.current = t0;
    phaseStartedAt.current = t0;
    setElapsed(0);
    setRound(0);
    setRounds(0);
    setPaused(false);
    setPhase("work");
    chime("work");
  };

  const togglePause = () => {
    if (paused) {
      pausedFor.current += Date.now() - pausedAt.current;
      setPaused(false);
    } else {
      pausedAt.current = Date.now();
      setPaused(true);
    }
  };

  const reset = () => {
    setPhase("idle");
    setElapsed(0);
    setRound(0);
    setRounds(0);
    setPaused(false);
  };

  /* ------------------------------ display -------------------------------- */

  const nameOf = (id: string) => {
    const ex = EXERCISES.find((e) => e.id === id);
    return ex ? ex.name[li === 1 ? "ru" : "en"] : id;
  };

  const remaining =
    spec.mode === "interval"
      ? Math.max(0, (phase === "rest" ? restSec : workSec) - (elapsed > 0 ? (now() - phaseStartedAt.current) / 1000 : 0))
      : Math.max(0, totalSec - elapsed);

  const bigClock =
    spec.mode === "fortime" ? mmss(elapsed) : mmss(remaining);

  const pct =
    spec.mode === "interval"
      ? Math.min(100, ((round + 1) / Math.max(1, totalRounds)) * 100)
      : Math.min(100, (elapsed / Math.max(1, totalSec)) * 100);

  /* Which station is live, for the multi-station interval circuits. */
  const station =
    spec.mode === "interval" && circuit.steps.length > 1
      ? circuit.steps[round % circuit.steps.length]
      : null;

  const running = phase === "work" || phase === "rest";

  return (
    <section className="panel p-6">
      {/* clock */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-condensed text-xs uppercase tracking-widest text-ash-dim">
            {phase === "rest"
              ? t("rest")
              : phase === "done"
                ? t("finished")
                : spec.mode === "amrap"
                  ? t("timeLeft")
                  : spec.mode === "fortime"
                    ? t("elapsed")
                    : t("work")}
          </p>
          <p
            className={`font-display text-[clamp(3rem,14vw,5.5rem)] leading-none tabular-nums ${
              phase === "rest" ? "text-azure" : "text-bone"
            }`}
          >
            {bigClock}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {paused && <span className="badge border-blood/50 text-blood">{t("paused")}</span>}
          <button
            type="button"
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              setSoundEnabled(next);
              if (next) chime("rest");
            }}
            aria-pressed={soundOn}
            aria-label={soundOn ? t("soundOff") : t("soundOn")}
            className={`grid h-10 w-10 place-items-center rounded-full border transition-colors ${
              soundOn ? "border-blood/50 text-blood" : "border-line text-ash-dim"
            }`}
          >
            <Icon name={soundOn ? "sound" : "soundOff"} size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full border border-line/60 bg-void">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-linear ${
            phase === "rest" ? "bg-azure" : "bg-gradient-to-r from-blood to-ember"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* what to be doing right now */}
      {running && (
        <div className="mt-5 rounded-xl border border-line px-4 py-4">
          {spec.mode === "interval" ? (
            <>
              <p className="font-condensed text-xs uppercase tracking-widest text-ash-dim">
                {t("roundOf", { n: round + 1, total: totalRounds })}
              </p>
              <p className="mt-1.5 font-display text-2xl uppercase leading-none">
                {phase === "rest"
                  ? t("rest")
                  : station
                    ? nameOf(station.exerciseId)
                    : circuit.steps.map((s) => `${s.reps ?? ""} ${nameOf(s.exerciseId)}`).join(" · ")}
              </p>
            </>
          ) : (
            <>
              <p className="font-condensed text-xs uppercase tracking-widest text-ash-dim">
                {t("theRound")}
              </p>
              <ul className="mt-2 space-y-1">
                {circuit.steps.map((s) => (
                  <li key={s.exerciseId} className="text-sm text-bone">
                    <span className="font-display text-blood">{s.reps ?? `${s.seconds}s`}</span>{" "}
                    {nameOf(s.exerciseId)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* AMRAP round counter — the score */}
      {running && spec.mode === "amrap" && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-blood/40 bg-blood/5 px-4 py-3.5">
          <div>
            <p className="font-condensed text-xs uppercase tracking-widest text-ash-dim">
              {t("roundsDone")}
            </p>
            <p className="font-display text-4xl leading-none text-blood">{rounds}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setRounds((r) => r + 1);
              chime("work");
            }}
            className="btn btn-primary !px-6"
          >
            +1
          </button>
        </div>
      )}

      {/* controls */}
      <div className="mt-5 flex flex-wrap gap-2">
        {phase === "idle" && (
          <button type="button" onClick={begin} className="btn btn-primary shine flex-1">
            <Icon name="bolt" size={16} /> {t("start")}
          </button>
        )}
        {running && (
          <>
            <button type="button" onClick={togglePause} className="btn btn-ghost flex-1">
              {paused ? t("resume") : t("pause")}
            </button>
            <button
              type="button"
              onClick={() => finish(spec.mode === "fortime")}
              className="btn btn-primary flex-1"
            >
              {t("finish")}
            </button>
          </>
        )}
        {phase === "done" && (
          <>
            <div className="w-full rounded-xl border border-blood/40 bg-blood/5 px-4 py-3.5 text-center">
              <p className="font-condensed text-xs uppercase tracking-widest text-ash-dim">
                {t("yourScore")}
              </p>
              <p className="mt-1 font-display text-3xl leading-none text-blood">
                {spec.mode === "amrap"
                  ? t("scoreRounds", { n: rounds })
                  : spec.mode === "fortime"
                    ? mmss(elapsed)
                    : t("scoreRounds", { n: round + 1 })}
              </p>
            </div>
            <button type="button" onClick={reset} className="btn btn-ghost mt-2 w-full">
              {t("again")}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
