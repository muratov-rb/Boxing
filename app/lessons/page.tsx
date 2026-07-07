import type { Metadata } from "next";
import { LessonsClient } from "@/components/lessons/LessonsClient";

export const metadata: Metadata = {
  title: "Lesson Library — Pressure",
  description:
    "AI-curated boxing and conditioning lessons filtered to your equipment, with 3D technique demos and muscle maps.",
};

export default function LessonsPage() {
  return <LessonsClient />;
}
