import { NextResponse } from "next/server";
import { currentAdmin, auditAdmin } from "@/lib/admin-auth";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { REPLY_MAX, type SupportReply } from "@/lib/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* The owner answering, inside the site.

   Support used to end at the inbox: someone wrote in, and the only way to
   answer was an email they might never connect back to their account. The
   reply now lands on the ticket itself, and the user reads it where they filed
   it -- signed in, with the original message above it. */

/** Every message on one ticket, oldest first, for the panel's thread view. */
export async function GET(req: Request) {
  if (!(await currentAdmin())) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "no_service_key" }, { status: 503 });
  }

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { data, error } = await createAdminClient()
    .from("support_replies")
    .select("id, author, body, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true })
    .returns<SupportReply[]>();

  if (error) {
    console.error("[admin_thread]", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }
  return NextResponse.json({ replies: data ?? [] });
}

export async function POST(req: Request) {
  const actor = await currentAdmin();
  if (!actor) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "no_service_key" }, { status: 503 });
  }

  let body: { id?: unknown; body?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const id = typeof body.id === "number" ? body.id : NaN;
  const text = typeof body.body === "string" ? body.body.trim().slice(0, REPLY_MAX) : "";
  if (!Number.isFinite(id) || !text) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("support_replies")
    .insert({ ticket_id: id, author: "admin", body: text });
  if (error) {
    console.error("[admin_reply]", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  const now = new Date().toISOString();
  /* last_reply_at is what raises the unread marker on the user's side, and
     answering a request moves it out of "new" without closing it -- they may
     well write back. */
  await admin
    .from("support_tickets")
    .update({ last_reply_at: now, status: "open", updated_at: now })
    .eq("id", id);

  await auditAdmin(actor, "ticket_reply", null, { id });
  return NextResponse.json({ ok: true });
}
