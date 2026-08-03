import { NextResponse } from "next/server";
import { currentAdmin, auditAdmin } from "@/lib/admin-auth";
import { serviceRoleConfigured } from "@/lib/supabase/admin";
import {
  totpState,
  startEnrolment,
  confirmEnrolment,
  disableTotp,
} from "@/lib/admin-totp";

export const runtime = "nodejs";

/* Enrolling and removing the admin second factor.

   Everything here acts on the signed-in admin only — the username comes from
   the session cookie, never from the request body. Otherwise one admin could
   reset the other's authenticator and lock them out. */

export async function GET() {
  const actor = await currentAdmin();
  if (!actor) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "no_service_key" }, { status: 503 });
  }
  return NextResponse.json({
    username: actor.username,
    ...(await totpState(actor.username)),
  });
}

export async function POST(req: Request) {
  const actor = await currentAdmin();
  if (!actor) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "no_service_key" }, { status: 503 });
  }

  let body: { action?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (body.action === "start") {
    const started = await startEnrolment(actor.username);
    if (!started) return NextResponse.json({ error: "start_failed" }, { status: 500 });
    /* The secret leaves the server exactly once, to the admin already signed
       in, so they can put it in their authenticator. It is never returned
       again — a lost authenticator means enrolling afresh. */
    return NextResponse.json(started);
  }

  if (body.action === "confirm") {
    const ok = await confirmEnrolment(actor.username, body.code ?? "");
    if (!ok) return NextResponse.json({ error: "bad_code" }, { status: 400 });
    await auditAdmin(actor, "enable2fa", null, {});
    return NextResponse.json({ ok: true, enrolled: true });
  }

  if (body.action === "disable") {
    /* Requires a working code: a stolen session should not be able to strip
       the very thing protecting the account. */
    const ok = await disableTotp(actor.username, body.code ?? "");
    if (!ok) return NextResponse.json({ error: "bad_code" }, { status: 400 });
    await auditAdmin(actor, "disable2fa", null, {});
    return NextResponse.json({ ok: true, enrolled: false });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
