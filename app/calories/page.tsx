import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CaloriesClient } from "@/components/calories/CaloriesClient";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Calories — RingBornn" };

/* The calorie counter was a card competing for space on the dashboard. Logging
   a meal is its own task, done several times a day, so it gets its own page. */
export default async function CaloriesPage() {
  const configured = isSupabaseConfigured();
  const user = await getUser();
  if (configured && !user) redirect("/login?next=/calories");

  return <CaloriesClient />;
}
