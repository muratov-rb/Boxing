import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = {
  title: "Get Your Plan — Pressure",
  description:
    "Build your fighter profile and unlock your first rank. No account, no card, no gear.",
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
