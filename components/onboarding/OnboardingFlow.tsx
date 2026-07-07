"use client";

import { useEffect, useReducer, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { profileReducer, initialProfile } from "@/lib/onboarding";
import { saveProfile } from "@/lib/tracking";
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

  // keep the fighter profile locally so the lesson library and calorie
  // target can personalise themselves (until DB persistence lands)
  useEffect(() => {
    if (profile.path) saveProfile(profile);
  }, [profile]);

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
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
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

      <main className="flex flex-1 items-start justify-center px-6 py-12 sm:py-16">
        <div key={step} className="animate-rise w-full">
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
                dispatch({ type: "reset" });
                setAnalysis(null);
                go(0);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
