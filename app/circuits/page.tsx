import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircuitsClient } from "@/components/circuits/CircuitsClient";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Circuits — RingBornn" };

/* Named conditioning formats, run against a clock. Behind the login wall like
   the rest of training: finishing one logs a session, XP and a calorie burn,
   all of which need an account to belong to. */
export default async function CircuitsPage() {
  const configured = isSupabaseConfigured();
  const user = await getUser();
  if (configured && !user) redirect("/login?next=/circuits");

  return <CircuitsClient />;
}
