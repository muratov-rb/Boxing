/* Central Supabase config + a guard so the whole app runs before keys exist.
   NEXT_PUBLIC_* vars are safe to expose (they're the anon/publishable pair).

   Values resolve in order:
   1. build-time inlined NEXT_PUBLIC_* (the classic Next.js path)
   2. runtime env on the server — the computed key below defeats build-time
      inlining, so a deploy with fresh env vars works even when the build
      itself was restored from cache with stale (empty) inlined values
   3. window.__PRESSURE_ENV on the client, injected by the root layout from
      the server's runtime env */

declare global {
  interface Window {
    __PRESSURE_ENV?: Record<string, string>;
  }
}

function runtimeEnv(name: string): string {
  if (typeof window !== "undefined") {
    return window.__PRESSURE_ENV?.[name] ?? "";
  }
  return (process.env as Record<string, string | undefined>)[name] ?? "";
}

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || runtimeEnv("NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  runtimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/** The public pair, read server-side at request time — the root layout
    serialises this into `window.__PRESSURE_ENV` for the client bundle. */
export function publicSupabaseEnv(): Record<string, string> {
  return {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || runtimeEnv("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      runtimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

/** True only when real credentials are present (placeholders/empty → false). */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;
}
