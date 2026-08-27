import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
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
  /* The root layout deliberately withholds the admin strings so they are not
     part of every visitor's payload, so this page provides its own. Everything
     under here reads the "admin" namespace and nothing else. */
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  const wrap = (node: React.ReactNode) => (
    <NextIntlClientProvider locale={locale} messages={{ admin: messages.admin }}>
      {node}
    </NextIntlClientProvider>
  );

  const actor = await currentAdmin();
  if (!actor) {
    return wrap(<AdminGate configured={adminPasswordConfigured()} />);
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

  return wrap(
    <AdminClient
      users={list.users}
      problem={list.problem}
      detail={list.detail}
      me={actor}
    />,
  );
}
