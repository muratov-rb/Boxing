import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/* SERVER ONLY — and the import above makes that a build error rather than a
   convention. The service-role key bypasses row-level security, so it must
   never reach the browser. The admin is not a Supabase user (it is a fixed
   name/password), so its routes need this to read and edit other people's
   rows; RLS can't be the gate when there's no user session to check. */

/** Trimmed, because pasting a key into a terminal prompt very easily carries a
    trailing newline or space, and a key with whitespace fails as "unauthorised"
    with nothing to explain why. */
export function serviceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}

/** Why the admin data layer can't run — one value per cause, so the panel can
    say what is actually wrong instead of always blaming a missing key. */
export type ConfigProblem = "none" | "no_key" | "no_url" | "wrong_key";

/** The publishable/anon key is the easy mistake: it is the one on the same
    dashboard page, it is accepted by createClient, and it then fails every
    query in a way that looks like a permissions bug. Catch it up front. */
function looksLikeAPublicKey(key: string): boolean {
  if (key.startsWith("sb_publishable_")) return true;
  const parts = key.split(".");
  if (parts.length !== 3) return false; // not a JWT — assume a secret key
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as { role?: string };
    return payload.role !== undefined && payload.role !== "service_role";
  } catch {
    return false;
  }
}

export function serviceRoleProblem(): ConfigProblem {
  const key = serviceRoleKey();
  if (!key) return "no_key";
  if (!supabaseUrl()) return "no_url";
  if (looksLikeAPublicKey(key)) return "wrong_key";
  return "none";
}

export function serviceRoleConfigured(): boolean {
  return serviceRoleProblem() === "none";
}

export function createAdminClient() {
  const key = serviceRoleKey();
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
