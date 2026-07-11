import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabaseAnonKey } from "./config";

/* Browser-side Supabase client. Only call after isSupabaseConfigured(). */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
