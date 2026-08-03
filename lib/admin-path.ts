/* ===========================================================================
   Where the admin panel answers.

   /admin is the first path every scanner tries. Setting ADMIN_PATH moves the
   panel to a URL only the two of us know, and /admin then returns a plain 404
   — indistinguishable from a page that was never built. An attacker sweeping
   for admin panels finds nothing, so the password is never even reached.

   This is obscurity, and obscurity is not security on its own. What actually
   protects the panel is the long password, the scrypt hashing and the
   database-backed lockout. What this adds is that automated scanning — the
   overwhelming majority of attempts — stops finding a door to knock on.

   Unset, everything stays at /admin, so nothing breaks before it is
   configured. Kept free of `server-only` because the proxy runs on the edge.
   =========================================================================== */

export const DEFAULT_ADMIN_PATH = "/admin";

/** The path the panel is served from. Always starts with "/" and never ends
    with one, so comparisons elsewhere don't have to care. */
export function adminPath(): string {
  const raw = process.env.ADMIN_PATH?.trim();
  if (!raw) return DEFAULT_ADMIN_PATH;
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  const trimmed = withSlash.replace(/\/+$/, "");
  return trimmed === "" ? DEFAULT_ADMIN_PATH : trimmed;
}

/** True once the panel has been moved somewhere private. */
export function adminPathIsSecret(): boolean {
  return adminPath() !== DEFAULT_ADMIN_PATH;
}

/** Does this request path address the panel? */
export function isAdminRequest(pathname: string): boolean {
  const p = adminPath();
  return pathname === p || pathname.startsWith(`${p}/`);
}
