import type { Metadata } from "next";
import { AdminClient } from "@/components/admin/AdminClient";
import { AdminGate } from "@/components/admin/AdminGate";
import { isAdminAuthed, adminPasswordConfigured } from "@/lib/admin-auth";
import { listUsers, type UserList } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Admin — RingBornn" };
export const dynamic = "force-dynamic";

/* The admin is a single fixed login name + password held in env vars — not a
   user account. The list is read here on the server with the service-role key,
   so nothing privileged is handed to the browser and the panel has its data on
   first paint. */
export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    return <AdminGate configured={adminPasswordConfigured()} />;
  }

  let list: UserList | null = null;
  try {
    list = await listUsers();
  } catch {
    /* bad key, table missing, Supabase down — say so instead of crashing */
  }

  if (!list) return <AdminClient users={[]} loadFailed />;
  return <AdminClient users={list.users} serviceKeyMissing={list.serviceKeyMissing} />;
}
