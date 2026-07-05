/* Central Supabase config + a guard so the whole app runs before keys exist.
   NEXT_PUBLIC_* vars are safe to expose (they're the anon/publishable pair). */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True only when real credentials are present (placeholders/empty → false). */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;
}
