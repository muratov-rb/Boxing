import "server-only";
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createAdminClient, serviceRoleConfigured } from "./supabase/admin";

/* ===========================================================================
   Admin identity.

   Two kinds of account:

   - The bootstrap account, from ADMIN_USER / ADMIN_PASSWORD in the
     environment. It always works and cannot be deleted, which is what stops a
     mistake in the admins table from locking everyone out of the panel.
   - Named accounts in public.admin_users, each with its own password. Created
     from inside the panel by an existing admin.

   The cookie now carries WHO you are, not just that you got in. That is the
   whole point of the change: ban permanently deletes a user's training
   history, and with one shared login there was no way to tell who had done
   it. Named accounts are what make that record meaningful.

   The panel is never a Supabase account, so everything behind it runs through
   server routes holding the service-role key.
   =========================================================================== */

export const ADMIN_COOKIE = "rb_admin";
const SESSION_DAYS = 7;

/* Every admin is an owner. A reduced tier was removed deliberately: an account
   that can move subscriptions can hand out free plans, so "limited" access was
   never really limited. The type stays so the audit log keeps recording it. */
export type AdminRole = "owner";

export interface AdminIdentity {
  username: string;
  role: AdminRole;
}

/** Login name of the env-var owner. Defaults to "admin". */
export function adminUser(): string {
  return process.env.ADMIN_USER?.trim() || "admin";
}

function ownerPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length >= 4 ? pw : null;
}

/** Whether the gate can work at all. */
export function adminPasswordConfigured(): boolean {
  return ownerPassword() !== null;
}

/* ------------------------------ primitives -------------------------------- */

/** Constant-time compare that doesn't leak length through an early return. */
function sameSecret(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Secret the session cookie is signed with. Derived from the owner password,
    so changing it in Vercel still invalidates every session — including the
    named accounts', which is the behaviour you want when rotating. */
function signingKey(): string | null {
  const pw = ownerPassword();
  return pw ? createHash("sha256").update(`ringbornn-admin-sign:${pw}`).digest("hex") : null;
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  /* scrypt rather than a bare sha256: these are human-chosen passwords sitting
     in a table, so the hash has to be slow enough to make a stolen dump
     expensive to crack. No new dependency — it ships with Node. */
  return { salt, hash: scryptSync(password, salt, 64).toString("hex") };
}

function passwordMatches(password: string, salt: string, expected: string): boolean {
  const actual = scryptSync(password, salt, 64).toString("hex");
  return actual.length === expected.length && sameSecret(actual, expected);
}

/* -------------------------------- session --------------------------------- */

/** `base64(username:role:issuedAt).hmac` — readable by us, unforgeable by them. */
function makeToken(id: AdminIdentity): string | null {
  const key = signingKey();
  if (!key) return null;
  const payload = Buffer.from(`${id.username}:${id.role}:${Date.now()}`).toString("base64url");
  const mac = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

function readToken(token: string): AdminIdentity | null {
  const key = signingKey();
  if (!key) return null;

  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;

  const expected = createHmac("sha256", key).update(payload).digest("base64url");
  if (mac.length !== expected.length || !sameSecret(mac, expected)) return null;

  const [username, role, issued] = Buffer.from(payload, "base64url").toString().split(":");
  if (!username || role !== "owner") return null;

  const age = Date.now() - Number(issued);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_DAYS * 86_400_000) return null;

  return { username, role };
}

/* ------------------------------ verification ------------------------------ */

/** Check a login against the env owner first, then the admin_users table. */
export async function verifyAdminLogin(
  username: string,
  password: string,
): Promise<AdminIdentity | null> {
  const name = username.trim();
  const pw = ownerPassword();
  if (!pw) return null;

  /* Both comparisons always run so timing cannot reveal which half was wrong. */
  const ownerName = sameSecret(name, adminUser());
  const ownerPass = sameSecret(password, pw);
  if (ownerName && ownerPass) return { username: adminUser(), role: "owner" };

  if (!serviceRoleConfigured()) return null;

  try {
    const { data } = await createAdminClient()
      .from("admin_users")
      .select("username, password_hash, salt, role")
      .eq("username", name)
      .maybeSingle<{
        username: string;
        password_hash: string;
        salt: string;
        role: AdminRole;
      }>();

    if (!data || !passwordMatches(password, data.salt, data.password_hash)) return null;

    await createAdminClient()
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("username", data.username);

    return { username: data.username, role: data.role };
  } catch {
    return null;
  }
}

/** The signed cookie value for a verified identity. */
export function sessionToken(id: AdminIdentity): string | null {
  return makeToken(id);
}

/** Who is making this request, or null if nobody. */
export async function currentAdmin(): Promise<AdminIdentity | null> {
  if (!adminPasswordConfigured()) return null;
  const store = await cookies();
  const given = store.get(ADMIN_COOKIE)?.value;
  return given ? readToken(given) : null;
}

export async function isAdminAuthed(): Promise<boolean> {
  return (await currentAdmin()) !== null;
}

/* -------------------------------- auditing -------------------------------- */

/** Record an admin action. Never throws: failing to log must not fail the
    action itself, but a missing line is worth noticing in the panel. */
export async function auditAdmin(
  actor: AdminIdentity,
  action: string,
  targetUser?: string | null,
  detail: Record<string, unknown> = {},
): Promise<void> {
  if (!serviceRoleConfigured()) return;
  try {
    await createAdminClient().from("admin_audit").insert({
      actor: actor.username,
      role: actor.role,
      action,
      target_user: targetUser ?? null,
      detail,
    });
  } catch {
    /* best effort */
  }
}
