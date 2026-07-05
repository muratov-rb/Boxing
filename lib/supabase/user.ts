import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config";
import { createClient } from "./server";

/* Returns the current user, or null when unauthenticated / not configured. */
export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
