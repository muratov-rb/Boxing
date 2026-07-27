import "server-only";
import { createAdminClient, serviceRoleConfigured } from "./supabase/admin";
import type { UserRow } from "./admin-stats";

/* Reading the user list for the admin panel. The admin signs in with a fixed
   name and password rather than an account, so there is no user session for
   row-level security to check — these queries run with the service-role key
   on the server and their results are only ever rendered behind the gate. */

export interface UserList {
  users: UserRow[];
  serviceKeyMissing: boolean;
}

export async function listUsers(): Promise<UserList> {
  if (!serviceRoleConfigured()) return { users: [], serviceKeyMissing: true };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, email, plan, period, trial_start, banned, banned_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (error) throw error;

  // last training day per user, so the panel can see who is actually showing up
  const { data: activity } = await supabase
    .from("user_activity")
    .select("user_id, day")
    .order("day", { ascending: false })
    .limit(5000);

  const lastSeen = new Map<string, string>();
  for (const row of activity ?? []) {
    if (!lastSeen.has(row.user_id)) lastSeen.set(row.user_id, row.day);
  }

  return {
    users: (data ?? []).map((u) => ({
      ...u,
      last_active: lastSeen.get(u.user_id) ?? null,
    })) as UserRow[],
    serviceKeyMissing: false,
  };
}

