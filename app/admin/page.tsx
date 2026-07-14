import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminClient } from "@/components/admin/AdminClient";
import { AdminGate } from "@/components/admin/AdminGate";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/user";
import { isAdminAuthed, adminPasswordConfigured } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Admin — RingBornn" };

export default async function AdminPage() {
  // layer 1: must be signed in
  if (isSupabaseConfigured()) {
    const user = await getUser();
    if (!user) redirect("/login?next=/admin");
  }
  // layer 2: admin password (ADMIN_PASSWORD env) → httpOnly cookie
  if (!(await isAdminAuthed())) {
    return <AdminGate configured={adminPasswordConfigured()} />;
  }
  // layer 3: Supabase RLS (admins table) protects the actual data
  return <AdminClient />;
}
