import type { Metadata } from "next";
import { PlansClient } from "@/components/plans/PlansClient";

export const metadata: Metadata = { title: "Plans & Pricing — RingBornn" };

export default function PlansPage() {
  return <PlansClient />;
}
