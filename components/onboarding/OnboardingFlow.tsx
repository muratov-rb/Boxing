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

  /* Pick up where they left off. The answers were already being saved; they
     were simply never read back, so anyone who closed the tab — or used the
     Exit link in the header above — restarted from an empty form. */
  useEffect(() => {
    const saved = loadProfile();
    if (saved?.path) {
      dispatch({ type: "patch", patch: saved });
      const at = Math.min(LAST, loadOnboardingStep());
      if (at > 0) {
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

      {step < LAST && <ProgressRail steps={rail} current={step} />}

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

      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:px-6 sm:py-16">
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
