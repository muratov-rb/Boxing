/* Central Supabase config + a guard so the whole app runs before keys exist.
   NEXT_PUBLIC_* vars are safe to expose (they're the anon/publishable pair).

   Everything here reads at CALL TIME (never a frozen module-level constant),
   so a deploy whose build inlined empty NEXT_PUBLIC values still connects:
   - server: reads process.env fresh on every request
   - client: reads window.__PRESSURE_ENV, injected by the root layout from the
     server's request-time env
   This is why isSupabaseConfigured() must call supabaseUrl()/supabaseAnonKey()
   rather than capture them once. */

declare global {
  interface Window {
    __PRESSURE_ENV?: Record<string, string>;
  }
}

function readEnv(name: string): string {
  if (typeof window !== "undefined") {
    // client: build-time inlined value first, then the runtime bridge
    const inlined =
      name === "NEXT_PUBLIC_SUPABASE_URL"
        ? process.env.NEXT_PUBLIC_SUPABASE_URL
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return inlined || window.__PRESSURE_ENV?.[name] || "";
  }
  // server: always the live process env at request time
  return (process.env as Record<string, string | undefined>)[name] ?? "";
}

export function supabaseUrl(): string {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function supabaseAnonKey(): string {
  return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/** The public pair, read server-side at request time — the root layout
    serialises this into `window.__PRESSURE_ENV` for the client bundle. */
export function publicSupabaseEnv(): Record<string, string> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey(),
  };
}

/** True only when real credentials are present (placeholders/empty → false). */
export function isSupabaseConfigured(): boolean {
  return supabaseUrl().startsWith("http") && supabaseAnonKey().length > 20;
}
