import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/* Admin gate: ONE fixed login name and ONE password, both living only in env
   vars (never in the repo — it's public). The admin is not a Supabase account,
   so the panel does its work through server routes holding the service-role
   key rather than through the browser's RLS-limited session.

   The cookie stores a hash of name+password, so changing either value in
   Vercel instantly invalidates every existing admin session. */

export const ADMIN_COOKIE = "rb_admin";

/** Login name. Defaults to "admin" so only a password is strictly required. */
export function adminUser(): string {
  return process.env.ADMIN_USER?.trim() || "admin";
}

export function adminToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 4) return null;
  return createHash("sha256")
    .update(`ringbornn-admin:${adminUser()}:${pw}`)
    .digest("hex");
}

/** Constant-time compare that doesn't leak length through an early return. */
function sameSecret(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 4) return false;
  // both must match; evaluate both so timing doesn't reveal which failed
  const okUser = sameSecret(username.trim(), adminUser());
  const okPass = sameSecret(password, pw);
  return okUser && okPass;
}

export async function isAdminAuthed(): Promise<boolean> {
  const token = adminToken();
  if (!token) return false;
  const store = await cookies();
  const given = store.get(ADMIN_COOKIE)?.value;
  return !!given && given.length === token.length && sameSecret(given, token);
}

/** Whether the gate can work at all (env var present). */
export function adminPasswordConfigured(): boolean {
  return adminToken() !== null;
}
