import { SiteNav } from "@/components/landing/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { AudienceSplit } from "@/components/landing/AudienceSplit";
import { FeaturePreview } from "@/components/landing/FeaturePreview";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { getUser } from "@/lib/supabase/user";
import type { Metadata } from "next";

/* Title and description come from the root layout. Only the canonical lives
   here: set in the layout it would be inherited by every page that doesn't
   override it, and tell Google they are all copies of the homepage. */
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function LandingPage() {
  const user = await getUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav authed={!!user} />
      <main className="flex-1">
        <Hero />
        <AudienceSplit />
        <FeaturePreview />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
