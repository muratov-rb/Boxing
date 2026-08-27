import { NextResponse } from "next/server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/user";
import {
  CHALLENGE_KINDS,
  CHALLENGE_MAX,
  type Challenge,
  type ChallengeKind,
} from "@/lib/friends";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Challenges between partners.

   You may only challenge someone you are actually linked to. Without that
   check this is an open channel for sending arbitrary text to any account,
   which is a spam and harassment vector rather than a feature. */

interface Row {
  id: number;
  from_id: string;
  to_id: string;
  kind: string;
  body: string;
  status: string;
  created_at: string;
}

async function areFriends(a: string, b: string): Promise<boolean> {
  const { count } = await createAdminClient()
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(
      `and(requester_id.eq.${a},addressee_id.eq.${b}),and(requester_id.eq.${b},addressee_id.eq.${a})`,
    );
  return (count ?? 0) > 0;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("challenges")
    .select("id, from_id, to_id, kind, body, status, created_at")
    .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(60)
    .returns<Row[]>();

  if (!rows?.length) return NextResponse.json({ challenges: [] });

  const others = [...new Set(rows.map((r) => (r.from_id === user.id ? r.to_id : r.from_id)))];
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("user_id, display_name")
    .in("user_id", others)
    .returns<{ user_id: string; display_name: string | null }[]>();
  const nameOf = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);

  const challenges: Challenge[] = rows.map((r) => ({
    id: r.id,
    kind: r.kind as ChallengeKind,
    body: r.body,
    status: r.status as Challenge["status"],
    createdAt: r.created_at,
    mine: r.from_id === user.id,
    otherName: nameOf.get(r.from_id === user.id ? r.to_id : r.from_id) ?? null,
  }));

  return NextResponse.json({ challenges });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { to?: unknown; kind?: unknown; body?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const to = typeof body.to === "string" ? body.to : "";
  const kind = CHALLENGE_KINDS.includes(body.kind as ChallengeKind)
    ? (body.kind as ChallengeKind)
    : null;
  const text = typeof body.body === "string" ? body.body.trim().slice(0, CHALLENGE_MAX) : "";

  if (!to || !kind || !text || to === user.id) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!(await areFriends(user.id, to))) {
    return NextResponse.json({ error: "not_partners" }, { status: 403 });
  }

  /* One open challenge at a time per partner. Otherwise "send" becomes a
     button you can hold down. */
  const { count } = await createAdminClient()
    .from("challenges")
    .select("id", { count: "exact", head: true })
    .eq("from_id", user.id)
    .eq("to_id", to)
    .eq("status", "sent");
  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: "too_many_open" }, { status: 429 });
  }

  const { error } = await createAdminClient()
    .from("challenges")
    .insert({ from_id: user.id, to_id: to, kind, body: text });
  if (error) {
    console.error("[challenge_send]", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** Accept, decline, or mark done. */
export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { id?: unknown; action?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const id = typeof body.id === "number" ? body.id : NaN;
  const map: Record<string, string> = { accept: "accepted", decline: "declined", done: "done" };
  const status = typeof body.action === "string" ? map[body.action] : undefined;
  if (!Number.isFinite(id) || !status) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  /* The receiver accepts or declines; either side may mark it done, because
     the person who set it is often the one who watched it happen. */
  let q = createAdminClient()
    .from("challenges")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", id);
  q = status === "done" ? q.or(`from_id.eq.${user.id},to_id.eq.${user.id}`) : q.eq("to_id", user.id);

  const { data, error } = await q.select("id").maybeSingle<{ id: number }>();
  if (error) {
    console.error("[challenge_respond]", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true, status });
}
