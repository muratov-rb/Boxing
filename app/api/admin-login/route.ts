import { NextResponse } from "next/server";
import { adminToken, verifyAdminCredentials, ADMIN_COOKIE } from "@/lib/admin-auth";
import { checkRate, recordFailure, recordSuccess, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

/* Login name + password → httpOnly admin cookie. The panel behind this can
   delete every user's data, so guessing is throttled per source as well as
   slowed by a fixed delay; the real secrets never reach the client. */
export async function POST(req: Request) {
  const who = clientKey(req);
  const rate = await checkRate(who);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "too_many_attempts", retryAfter: rate.retryAfter },
      { status: 429, headers: { "retry-after": String(rate.retryAfter) } },
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const token = adminToken();
  if (!token) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  await new Promise((r) => setTimeout(r, 400)); // slow down guessing

  if (!body.password || !verifyAdminCredentials(body.username ?? "", body.password)) {
    await recordFailure(who);
    // one message for both fields — never reveal which half was wrong
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }

  await recordSuccess(who);
  const res = NextResponse.json({ ok: true });
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
