"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AppNav } from "@/components/nav/AppNav";
import { Icon } from "@/components/ui/Icons";
import { CircuitRunner } from "./CircuitRunner";
import { CIRCUITS, availableCircuits, circuitMinutes, type Circuit } from "@/lib/circuits";
import { EXERCISES } from "@/lib/exercises";
import { loadProfile } from "@/lib/tracking";

/* The circuit library.

   No illustrations here on purpose. A lesson teaches a movement and needs a
   picture; a circuit is a rule about movements you already know, so the useful
   content is the rule, the clock and the score. That is also why this suits
   the experienced half of the audience — it assumes the movements are known. */

export function CircuitsClient() {
  const t = useTranslations("circuits");
  const locale = useLocale();
  const li = locale === "ru" ? 1 : 0;

  const [open, setOpen] = useState<Circuit | null>(null);
  const [list, setList] = useState<Circuit[]>(CIRCUITS);

  /* Equipment filtering happens after mount — the profile lives in
     localStorage, and rendering the full list first then cutting it would
     flash circuits the reader cannot do. */
  useEffect(() => {
    setList(availableCircuits(loadProfile()));
  }, []);

  const nameOf = (id: string) => {
    const ex = EXERCISES.find((e) => e.id === id);
    return ex ? ex.name[li === 1 ? "ru" : "en"] : id;
  };

  const formatLabel = (x: Circuit) =>
    x.timer.mode === "amrap"
      ? t("fmtAmrap", { n: x.timer.minutes ?? 0 })
      : x.timer.mode === "fortime"
        ? t("fmtForTime")
        : x.timer.restSec === 0
          ? t("fmtEmom", { n: x.timer.rounds ?? 0 })
          : t("fmtInterval", {
              work: x.timer.workSec ?? 0,
              rest: x.timer.restSec ?? 0,
              n: x.timer.rounds ?? 0,
            });

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
          {t("titlePre")}
          <span className="text-blood">{t("titleAccent")}</span>
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ash">{t("sub")}</p>

        {!open ? (
          <ul className="mt-8 space-y-3">
            {list.map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => setOpen(x)}
                  className="panel group w-full p-5 text-left transition-colors hover:border-blood/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl uppercase leading-none">
                        {x.name[li]}
                      </h2>
                      <p className="mt-1.5 font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                        {x.origin[li]}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="badge">{t("lvl", { n: x.level })}</span>
                      <span className="badge border-blood/40 text-blood">
                        {circuitMinutes(x)} {t("min")}
                      </span>
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-ash">{x.blurb[li]}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ash-dim">
                    <span className="font-condensed uppercase tracking-wider text-blood">
                      {formatLabel(x)}
                    </span>
                    <span className="truncate">
                      {x.steps
                        .map((s) => `${s.reps ?? `${s.seconds}s`} ${nameOf(s.exerciseId)}`)
                        .join(" · ")}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="mb-5 inline-flex items-center gap-2 font-condensed text-xs uppercase tracking-widest text-ash transition-colors hover:text-bone"
            >
              <span className="rotate-180">
                <Icon name="arrow" size={14} />
              </span>
              {t("back")}
            </button>

            <h2 className="font-display text-[clamp(1.8rem,5vw,3rem)] uppercase leading-none">
              {open.name[li]}
            </h2>
            <p className="mt-2 font-condensed text-xs uppercase tracking-widest text-ash-dim">
              {open.origin[li]} · {formatLabel(open)}
            </p>

            <div className="mt-6">
              <CircuitRunner circuit={open} />
            </div>

            {/* the rules, as text — read once before you start */}
            <section className="panel mt-4 p-6">
              <h3 className="font-condensed text-sm font-bold uppercase tracking-widest text-ash">
                {t("howTo")}
              </h3>
              <ol className="mt-4 space-y-3">
                {open.howTo.map((line, i) => (
                  <li key={line[0]} className="flex gap-3 text-sm leading-relaxed text-ash">
                    <span className="font-display text-blood">{i + 1}</span>
                    <span>{line[li]}</span>
                  </li>
                ))}
              </ol>

              <h3 className="mt-6 font-condensed text-sm font-bold uppercase tracking-widest text-ash">
                {t("tooHard")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ash">{open.scaling[li]}</p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
