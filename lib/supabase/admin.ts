import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/* SERVER ONLY — and the import above makes that a build error rather than a
   convention. The service-role key bypasses row-level security, so it must
   never reach the browser. The admin is not a Supabase user (it is a fixed
   name/password), so its routes need this to read and edit other people's
   rows; RLS can't be the gate when there's no user session to check. */

export function serviceRoleConfigured(): boolean {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY && !!supabaseUrl();
}

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
