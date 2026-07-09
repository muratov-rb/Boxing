import type { Metadata } from "next";
import { NutritionClient } from "@/components/nutrition/NutritionClient";

export const metadata: Metadata = {
  title: "AI Nutrition — RingBornn",
  description:
    "Calorie and macro targets from your body stats and training load, with concrete meal ideas for every part of the day.",
};

export default function NutritionPage() {
  return <NutritionClient />;
}
