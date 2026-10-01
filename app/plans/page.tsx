import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { PlansClient } from "@/components/plans/PlansClient";
import { plansCopy } from "@/lib/seo-copy";

/* Its own description: without one it inherited the homepage's, so Google
   showed the same snippet for both pages. In the visitor's language. */
export async function generateMetadata(): Promise<Metadata> {
  const copy = plansCopy(await getLocale());
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: "/plans" },
  };
}

export default function PlansPage() {
  return <PlansClient />;
}
