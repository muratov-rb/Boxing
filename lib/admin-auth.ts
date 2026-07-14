import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/* Admin password gate. The password lives ONLY in the ADMIN_PASSWORD env var
   (never in the repo — it's public). The cookie stores a hash of the
   password, so changing the password in Vercel instantly invalidates every
   existing admin session. */

export const ADMIN_COOKIE = "rb_admin";

export function adminToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 4) return null;
  return createHash("sha256").update(`ringbornn-admin:${pw}`).digest("hex");
}

export function verifyAdminPassword(password: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 4) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(pw);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdminAuthed(): Promise<boolean> {
  const token = adminToken();
  if (!token) return false;
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === token;
}

/** Whether the gate can work at all (env var present). */
export function adminPasswordConfigured(): boolean {
  return adminToken() !== null;
}
