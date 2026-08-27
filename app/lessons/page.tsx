import type { Metadata } from "next";
import { LessonsClient } from "@/components/lessons/LessonsClient";

export const metadata: Metadata = {
  title: "Lesson Library — RingBornn",
  description:
    "AI-curated boxing and conditioning lessons filtered to your equipment, with animated technique demos and muscle maps.",
};

export default function LessonsPage() {
  return <LessonsClient />;
}
