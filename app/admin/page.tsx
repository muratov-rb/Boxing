import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminClient } from "@/components/admin/AdminClient";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Admin — RingBornn" };

export default async function AdminPage() {
  // must be signed in; the real authorization is Supabase RLS (admins table) —
  // non-admins simply can't read or write other users' rows.
  if (isSupabaseConfigured()) {
    const user = await getUser();
    if (!user) redirect("/login?next=/admin");
  }
  return <AdminClient />;
}
