import { NextResponse } from "next/server";
import { adminToken, verifyAdminPassword, ADMIN_COOKIE } from "@/lib/admin-auth";

export const runtime = "nodejs";

/* Password → httpOnly admin cookie. Brute force is blunted by a small delay;
   the real secret never reaches the client. */
export async function POST(req: Request) {
  let body: { password?: string };
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

  if (!body.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }

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
