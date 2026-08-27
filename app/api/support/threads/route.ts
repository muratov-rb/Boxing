import { NextResponse } from "next/server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/user";
import { REPLY_MAX, type SupportReply, type SupportThread } from "@/lib/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* A user reading and continuing their own support conversations.

   Tickets are matched on user_id, never on the email in the body: the form
   lets people type any reply address they like, so trusting it here would let
   anyone read someone else's thread by claiming their address.

   That does mean a request filed before signing in is not listed. It was filed
   by someone we could not identify, and answering it by email is the only
   route we ever had for it. */

interface TicketRow {
  id: number;
  topic: string;
  message: string;
  status: string;
  created_at: string;
  last_reply_at: string | null;
  user_seen_at: string | null;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: tickets, error } = await admin
    .from("support_tickets")
    .select("id, topic, message, status, created_at, last_reply_at, user_seen_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<TicketRow[]>();

  if (error) {
    console.error("[threads_list]", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }
  if (!tickets?.length) return NextResponse.json({ threads: [] });

  /* One query for every reply across the listed tickets, then grouped here.
     A query per ticket would be up to fifty round-trips for one screen. */
  const { data: replies } = await admin
    .from("support_replies")
    .select("id, ticket_id, author, body, created_at")
    .in(
      "ticket_id",
      tickets.map((t) => t.id),
    )
    .order("created_at", { ascending: true })
    .returns<(SupportReply & { ticket_id: number })[]>();

  const byTicket = new Map<number, SupportReply[]>();
  for (const r of replies ?? []) {
    const list = byTicket.get(r.ticket_id) ?? [];
    list.push({ id: r.id, author: r.author, body: r.body, created_at: r.created_at });
    byTicket.set(r.ticket_id, list);
  }

  const threads = tickets.map(
    (t): SupportThread => ({
      id: t.id,
      topic: t.topic as SupportThread["topic"],
      message: t.message,
      status: t.status as SupportThread["status"],
      created_at: t.created_at,
      last_reply_at: t.last_reply_at,
      user_seen_at: t.user_seen_at,
      replies: byTicket.get(t.id) ?? [],
    }),
  );

  return NextResponse.json({ threads });
}

/** The user says something more on a thread they own. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
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

  /* Ownership is checked before the insert. Without this, any signed-in user
     could append to any ticket by guessing a sequential id. */
  const { data: owner } = await admin
    .from("support_tickets")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ id: number }>();
  if (!owner) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { error } = await admin
    .from("support_replies")
    .insert({ ticket_id: id, author: "user", body: text });
  if (error) {
    console.error("[thread_reply]", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  /* A user answering reopens the request -- "done" would hide a live problem
     from the owner's queue. */
  await admin
    .from("support_tickets")
    .update({ status: "open", updated_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}

/** Marks a thread as read, which clears the unread dot. */
export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const id = typeof body.id === "number" ? body.id : NaN;
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  await createAdminClient()
    .from("support_tickets")
    .update({ user_seen_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
