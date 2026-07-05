import { SiteNav } from "@/components/landing/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { AudienceSplit } from "@/components/landing/AudienceSplit";
import { FeaturePreview } from "@/components/landing/FeaturePreview";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { getUser } from "@/lib/supabase/user";

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
