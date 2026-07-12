"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  BODY_PARTS,
  EXERCISES,
  type BodyPart,
  type Exercise,
} from "@/lib/exercises";
import { markTrainedToday, trainedToday, awardXp, entitlements } from "@/lib/tracking";
import { lessonLimitFor } from "@/lib/subscription";
import { LockedFeature } from "@/components/dashboard/LockedFeature";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { Icon } from "@/components/ui/Icons";
import { BodyMap } from "./BodyMap";
import { Exercise2D } from "./Exercise2D";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

function LevelDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Level ${level}`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={cx(
            "h-1.5 w-1.5 rounded-full",
            n <= level ? "bg-blood" : "bg-line",
          )}
        />
      ))}
    </span>
  );
}

/* ------------------------------ detail view ------------------------------ */
function LessonDetail({
  ex,
  onClose,
}: {
  ex: Exercise;
  onClose: () => void;
}) {
  const t = useTranslations("lessons");
  const locale = useLocale() === "ru" ? "ru" : "en";
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(trainedToday());
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={ex.name[locale]}
    >
      <div className="panel mx-auto max-w-3xl p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="badge">{t(`bp_${ex.bodyPart}`)}</span>
            <h2 className="mt-3 font-display text-3xl uppercase leading-none sm:text-4xl">
              {ex.name[locale]}
            </h2>
            <p className="mt-2 text-sm text-ash">{ex.desc[locale]}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 font-condensed text-xs uppercase tracking-widest text-ash hover:text-blood"
          >
            {t("close")}
          </button>
        </div>

        {/* 3D demo + body map */}
        <div className="mt-6 grid gap-4 sm:grid-cols-5">
          <div className="min-w-0 sm:col-span-3">
            <div className="overflow-hidden rounded-lg border border-line/70 bg-void/40">
              <Exercise2D preset={ex.demo} className="h-64 w-full sm:h-80" />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ash-dim">
              <Icon name="target" size={12} /> {t("dragHint")}
            </p>
          </div>
          <div className="sm:col-span-2">
            <div className="rounded-lg border border-line/70 bg-void/40 p-3">
              <BodyMap muscles={ex.muscles} className="h-auto w-full" />
            </div>
            <p className="mt-2 text-xs text-ash-dim">{t("musclesHint")}</p>
          </div>
        </div>

        {/* prescription + steps */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="badge border-blood/40 text-blood">{ex.dose[locale]}</span>
          <span className="badge">
            <LevelDots level={ex.level} />
            <span className="ml-1">{t(`level${ex.level}`)}</span>
          </span>
          <span className="badge">~{ex.kcal10min} kcal / 10 {t("min")}</span>
        </div>

        <h3 className="mt-6 font-condensed text-sm font-bold uppercase tracking-widest">
          {t("technique")}
        </h3>
        <ol className="mt-3 space-y-2.5">
          {ex.steps[locale].map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-bone/90">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-line font-condensed text-xs text-ash">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>

        <div className="mt-7 flex items-center justify-between border-t border-line/70 pt-5">
          <p className="text-xs text-ash-dim">{t("doneHint")}</p>
          <button
            type="button"
            disabled={done}
            onClick={() => {
              markTrainedToday();
              awardXp("lesson"); // each lesson done earns rank XP
              setDone(true);
            }}
            className="btn btn-primary"
          >
            {done ? (
              <>
                <Icon name="check" size={16} /> {t("doneToday")}
              </>
            ) : (
              t("markDone")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- page ---------------------------------- */
export function LessonsClient() {
  const t = useTranslations("lessons");
  const locale = useLocale() === "ru" ? "ru" : "en";

  const tp = useTranslations("plans");
  const [part, setPart] = useState<BodyPart | "all">("all");
  const [open, setOpen] = useState<Exercise | null>(null);
  const [cap, setCap] = useState<number>(Number.POSITIVE_INFINITY);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const tier = entitlements().lessonTier;
    setLocked(tier === "none");
    setCap(lessonLimitFor(tier));
  }, []);

  const full = useMemo(
    () => (part === "all" ? EXERCISES : EXERCISES.filter((e) => e.bodyPart === part)),
    [part],
  );
  const list = useMemo(() => full.slice(0, cap), [full, cap]);
  const truncated = full.length > list.length;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* top bar */}
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
          {t("titlePre")}
          <span className="text-blood">{t("titleAccent")}</span>
        </h1>
        <p className="mt-3 max-w-xl text-ash">{t("sub")}</p>

        {locked ? (
          <div className="mt-8">
            <LockedFeature icon="video" title={tp("f_lessons")} body={tp("lockedLessons")} />
          </div>
        ) : (
        <>
        {/* filters */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={part === "all"}
            onClick={() => setPart("all")}
            className={cx(
              "badge transition-colors",
              part === "all" && "!border-blood !text-blood",
            )}
          >
            {t("all")}
          </button>
          {BODY_PARTS.map((bp) => (
            <button
              key={bp}
              type="button"
              aria-pressed={part === bp}
              onClick={() => setPart(bp)}
              className={cx(
                "badge transition-colors",
                part === bp && "!border-blood !text-blood",
              )}
            >
              {t(`bp_${bp}`)}
            </button>
          ))}
        </div>

        {/* grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setOpen(ex)}
              className="panel group p-5 text-left transition-transform duration-200 hover:-translate-y-0.5"
            >
              {/* the lesson's body-part picture */}
              <div className="border border-line/60 bg-void/40 p-2">
                <BodyMap muscles={ex.muscles} className="h-36 w-full" />
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <h3 className="font-condensed text-lg font-bold uppercase tracking-wide">
                  {ex.name[locale]}
                </h3>
                <LevelDots level={ex.level} />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-ash">{ex.desc[locale]}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="badge">{t(`bp_${ex.bodyPart}`)}</span>
                <span className="font-condensed text-xs uppercase tracking-wider text-blood transition-colors group-hover:text-blood-bright">
                  {t("open")} →
                </span>
              </div>
            </button>
          ))}
        </div>

        {truncated && (
          <Link
            href="/plans"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-blood/40 bg-blood/5 px-4 py-3 text-sm text-ash transition-colors hover:text-bone"
          >
            <Icon name="lock" size={14} /> {tp("lessonsLimited", { shown: list.length, total: full.length })}
          </Link>
        )}

        {list.length === 0 && !locked && (
          <p className="mt-10 text-center text-ash">{t("empty")}</p>
        )}
        </>
        )}
      </main>

      {open && <LessonDetail ex={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
