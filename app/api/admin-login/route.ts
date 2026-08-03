import { NextResponse } from "next/server";
import {
  verifyAdminLogin,
  sessionToken,
  adminPasswordConfigured,
  ADMIN_COOKIE,
} from "@/lib/admin-auth";
import { checkRate, recordFailure, recordSuccess, clientKey } from "@/lib/rate-limit";
import { totpRequired, checkLoginCode } from "@/lib/admin-totp";

export const runtime = "nodejs";

/* Login name + password → httpOnly admin cookie carrying who you are and what
   you may do. The panel behind this can delete every user's training history,
   so guessing is throttled per source as well as slowed by a fixed delay. */
export async function POST(req: Request) {
  const who = clientKey(req);
  const rate = await checkRate(who);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "too_many_attempts", retryAfter: rate.retryAfter },
      { status: 429, headers: { "retry-after": String(rate.retryAfter) } },
    );
  }

  let body: { username?: string; password?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!adminPasswordConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  await new Promise((r) => setTimeout(r, 400)); // slow down guessing

  const identity = body.password
    ? await verifyAdminLogin(body.username ?? "", body.password)
    : null;

  if (!identity) {
    await recordFailure(who);
    // one message for every failure — never reveal which half was wrong
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }

  /* Second factor, if this admin has one. Asked for only after the password
     is right: prompting everyone would tell a stranger which usernames exist.
     A wrong code counts as a failed attempt, so the same lockout applies. */
  let needsCode: boolean;
  try {
    needsCode = await totpRequired(identity.username);
  } catch {
    /* We could not find out whether this account has a second factor, so we
       cannot know that skipping it is safe. Refuse rather than guess. */
    return NextResponse.json({ error: "totp_unavailable" }, { status: 503 });
  }

  if (needsCode) {
    if (!body.code) {
      return NextResponse.json({ error: "totp_required" }, { status: 401 });
    }
    if (!(await checkLoginCode(identity.username, body.code))) {
      await recordFailure(who);
      return NextResponse.json({ error: "totp_invalid" }, { status: 401 });
    }
  }

  const token = sessionToken(identity);
  if (!token) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  await recordSuccess(who);
  const res = NextResponse.json({ ok: true, role: identity.role });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}

/* Sign out of the admin panel. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
