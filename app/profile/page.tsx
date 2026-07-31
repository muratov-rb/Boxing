import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Profile — RingBornn" };

export default async function ProfilePage() {
  /* Same guard the dashboard uses: the email shown here is the account's, so
     it has to come from the session rather than anything the client claims. */
  const configured = isSupabaseConfigured();
  const user = await getUser();
  if (configured && !user) redirect("/login?next=/profile");

  return <ProfileClient email={user?.email ?? null} />;
}
