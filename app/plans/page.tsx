import type { Metadata } from "next";
import { PlansClient } from "@/components/plans/PlansClient";

/* Its own description: without one it inherited the homepage's, so Google
   showed the same snippet for both pages. */
export const metadata: Metadata = {
  title: "Plans & Pricing — RingBornn",
  description:
    "Compare RingBornn's Budget, Pro and Max plans, monthly or yearly. Every account starts with a 7-day free trial, no card needed.",
  alternates: { canonical: "/plans" },
};

export default function PlansPage() {
  return <PlansClient />;
}
