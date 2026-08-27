"use client";

import { useEffect, useReducer, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { profileReducer, initialProfile } from "@/lib/onboarding";
import {
  clearOnboarding,
  loadOnboardingStep,
  loadProfile,
  saveOnboardingStep,
  saveProfile,
} from "@/lib/tracking";
import type { Analysis } from "@/lib/analysis";
import { Icon } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ProgressRail } from "./ProgressRail";
import { PathSelector } from "./PathSelector";
import { ProfileForm } from "./ProfileForm";
import { SetupStep } from "./SetupStep";
import { FuelStep } from "./FuelStep";
import { AnalysisReveal } from "./AnalysisReveal";
import { DashboardPreview } from "./DashboardPreview";

const LAST = 5; // dashboard preview

export function OnboardingFlow() {
  const t = useTranslations("onb");
  const [profile, dispatch] = useReducer(profileReducer, initialProfile);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [step, setStep] = useState(0);
  /* Nothing renders until localStorage has been read. Showing screen one and
     then jumping to screen four a frame later looks like a glitch, and reading
     storage during render would break hydration outright. */
  const [ready, setReady] = useState(false);
  const [resumed, setResumed] = useState(false);
  /* Someone who already finished this once and came back. They are not
     resuming a half-done form — they have a working plan and a decision to
     make, so they get asked rather than dropped back into step three. */
  const [returning, setReturning] = useState(false);

  /* Pick up where they left off. The answers were already being saved; they
     were simply never read back, so anyone who closed the tab — or used the
     Exit link in the header above — restarted from an empty form. */
  useEffect(() => {
    const saved = loadProfile();
    if (saved?.path) {
      dispatch({ type: "patch", patch: saved });
      const at = Math.min(LAST, loadOnboardingStep());

      /* A finished profile, not an abandoned one: they answered every screen
         that matters. Anything less is a half-filled form and resumes. */
      if (saved.timeframe && saved.environment && saved.nutritionAccess) {
        setReturning(true);
        setStep(LAST);
      } else if (at > 0) {
        setStep(at);
        setResumed(true);
      }
    }
    setReady(true);
  }, []);

  // keep the fighter profile locally so the lesson library and calorie
  // target can personalise themselves
  useEffect(() => {
    if (profile.path) saveProfile(profile);
  }, [profile]);

  /* Only once restored, or the initial 0 would overwrite a real saved step
     before the effect above has had a chance to read it. */
  useEffect(() => {
    if (ready) saveOnboardingStep(step);
  }, [ready, step]);

  const rail = [
    t("railPath"),
    t("railProfile"),
    t("railSetup"),
    t("railFuel"),
    t("railAnalysis"),
  ];

  const go = (n: number) => {
    setStep(Math.max(0, Math.min(LAST, n)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* top bar */}
      <header className="sticky top-0 z-50 border-b border-line/70 bg-void/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LocaleSwitcher />
            <Link
              href="/"
              className="font-condensed text-sm uppercase tracking-widest text-ash transition-colors hover:text-bone"
            >
              {t("exit")}
            </Link>
          </div>
        </div>
      </header>

      {/* A finished profile and a fresh visit: ask, don't assume. Someone who
          came back to change their targets and someone who just wanted their
          dashboard both land here, and guessing wrong either wipes a plan they
          liked or traps them in one they have outgrown. */}
      {ready && returning && (
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
          <p className="kicker">{t("welcomeBackKicker")}</p>
          <h1 className="mt-3 font-display text-[clamp(1.9rem,6vw,3rem)] uppercase leading-none">
            {t("welcomeBackTitle")}
          </h1>
          <p className="mt-3 leading-relaxed text-ash">{t("welcomeBackSub")}</p>

          <div className="mt-8 space-y-3">
            <Link
              href="/dashboard"
              className="panel group flex items-center justify-between gap-4 p-5 transition-colors hover:border-blood/40"
            >
              <span className="min-w-0">
                <span className="block font-display text-xl uppercase leading-none">
                  {t("keepTitle")}
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-ash">
                  {t("keepSub")}
                </span>
              </span>
              <span className="shrink-0 text-ash-dim transition-transform group-hover:translate-x-0.5 group-hover:text-blood">
                <Icon name="arrow" size={18} />
              </span>
            </Link>

            <button
              type="button"
              onClick={() => {
                /* Wipes the answers only. Streak, rank and training history
                   live under different keys and are deliberately untouched —
                   changing your targets is not starting your life over. */
                clearOnboarding();
                dispatch({ type: "reset" });
                setAnalysis(null);
                setReturning(false);
                setResumed(false);
                go(0);
              }}
              className="panel group flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:border-blood/40"
            >
              <span className="min-w-0">
                <span className="block font-display text-xl uppercase leading-none">
                  {t("rebuildTitle")}
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-ash">
                  {t("rebuildSub")}
                </span>
              </span>
              <span className="shrink-0 text-ash-dim transition-transform group-hover:translate-x-0.5 group-hover:text-blood">
                <Icon name="arrow" size={18} />
              </span>
            </button>
          </div>
        </main>
      )}

      {!returning && step < LAST && <ProgressRail steps={rail} current={step} />}

      {/* Say that we resumed, and offer the way out. Restoring answers silently
          would leave someone who wanted a clean start quietly editing an old
          profile they cannot see the top of. */}
      {resumed && step < LAST && (
        <div className="mx-auto mt-4 flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 rounded-xl border border-blood/40 bg-blood/5 px-4 py-3 sm:px-6">
          <p className="text-sm text-ash">{t("resumed")}</p>
          <button
            type="button"
            onClick={() => {
              clearOnboarding();
              dispatch({ type: "reset" });
              setAnalysis(null);
              setResumed(false);
              go(0);
            }}
            className="font-condensed text-xs uppercase tracking-widest text-blood transition-opacity hover:opacity-70"
          >
            {t("startFresh")}
          </button>
        </div>
      )}

      <main
        className={`flex-1 items-start justify-center px-4 py-12 sm:px-6 sm:py-16 ${
          returning ? "hidden" : "flex"
        }`}
      >
        <div key={step} className={ready ? "animate-rise w-full" : "w-full opacity-0"}>
          {step === 0 && (
            <PathSelector
              profile={profile}
              dispatch={dispatch}
              onNext={() => go(1)}
            />
          )}
          {step === 1 && (
            <ProfileForm
              profile={profile}
              dispatch={dispatch}
              onBack={() => go(0)}
              onNext={() => go(2)}
            />
          )}
          {step === 2 && (
            <SetupStep
              profile={profile}
              dispatch={dispatch}
              onBack={() => go(1)}
              onNext={() => go(3)}
            />
          )}
          {step === 3 && (
            <FuelStep
              profile={profile}
              dispatch={dispatch}
              onBack={() => go(2)}
              onNext={() => go(4)}
            />
          )}
          {step === 4 && (
            <AnalysisReveal
              profile={profile}
              onReady={setAnalysis}
              onBack={() => go(3)}
              onNext={() => go(5)}
            />
          )}
          {step === 5 && (
            <DashboardPreview
              profile={profile}
              analysis={analysis}
              onRestart={() => {
                clearOnboarding();
                dispatch({ type: "reset" });
                setAnalysis(null);
                setResumed(false);
                go(0);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
