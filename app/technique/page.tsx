import type { Metadata } from "next";
import { TechniqueClient } from "@/components/technique/TechniqueClient";

export const metadata: Metadata = { title: "Technique Check — RingBornn" };

export default function TechniquePage() {
  return <TechniqueClient />;
}
