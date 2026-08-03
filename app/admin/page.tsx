import type { Metadata } from "next";
import { AdminClient } from "@/components/admin/AdminClient";
import { AdminGate } from "@/components/admin/AdminGate";
import { currentAdmin, adminPasswordConfigured } from "@/lib/admin-auth";
import { listUsers, type UserList } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Admin — RingBornn" };
export const dynamic = "force-dynamic";

/* The admin is not a Supabase account — the login comes from the environment.
   The list is read here on the server with the service-role key, so nothing
   privileged is handed to the browser and the panel has its data on first
   paint. */
export default async function AdminPage() {
  const actor = await currentAdmin();
  if (!actor) {
    return <AdminGate configured={adminPasswordConfigured()} />;
  }

  let list: UserList;
  try {
    list = await listUsers();
  } catch (e) {
    // never a blank error page — the panel explains itself instead
    list = {
      users: [],
      problem: "query_failed",
      detail: e instanceof Error ? e.message : String(e),
    };
  }

  return (
    <AdminClient
      users={list.users}
      problem={list.problem}
      detail={list.detail}
      me={actor}
    />
  );
}
