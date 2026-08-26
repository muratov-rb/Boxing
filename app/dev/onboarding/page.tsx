"use client";

import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

/* Bench for the onboarding resume. /onboarding needs an account, and the whole
   point of the fix is what happens when you come BACK to a half-finished
   flow — which is only observable by seeding storage and reloading. */

export default function OnboardingBench() {
  return <OnboardingFlow />;
}
