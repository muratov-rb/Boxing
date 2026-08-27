import { NextResponse } from "next/server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/user";
import {
  MAX_FRIENDS,
  generateFriendCode,
  normaliseFriendCode,
  streakFrom,
  type Partner,
} from "@/lib/friends";
import { looksLikeEmail } from "@/lib/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Training partners.

   Adding someone by email cannot answer "is that address registered?" -- that
   would turn this endpoint into a way to test any address for an account. So
   an email that matches nobody returns exactly what a match returns. The person
   either turns up in your pending list or they do not. */

const STREAK_WINDOW_DAYS = 400;

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  friend_code: string | null;
}

/** Everyone's code is made on first read, so nothing has to backfill. */
async function myCode(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_profiles")
    .select("friend_code")
    .eq("user_id", userId)
    .maybeSingle<{ friend_code: string | null }>();

  if (data?.friend_code) return data.friend_code;

  /* The unique index is what actually settles a collision; retrying a few
     times turns a one-in-a-billion clash into a non-event. */
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateFriendCode();
    const { error } = await admin
      .from("user_profiles")
      .upsert(
        { user_id: userId, friend_code: code, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    if (!error) return code;
  }
  return "";
}

async function partnersFor(userId: string): Promise<{ friends: Partner[]; pending: Partner[] }> {
  const admin = createAdminClient();

  const { data: links } = await admin
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .in("status", ["pending", "accepted"])
    .returns<{ id: number; requester_id: string; addressee_id: string; status: string }[]>();

  if (!links?.length) return { friends: [], pending: [] };

  const otherOf = (l: (typeof links)[number]) =>
    l.requester_id === userId ? l.addressee_id : l.requester_id;
  const ids = [...new Set(links.map(otherOf))];

  const [{ data: profiles }, { data: progress }, { data: activity }] = await Promise.all([
    admin
      .from("user_profiles")
      .select("user_id, display_name, avatar_url, friend_code")
      .in("user_id", ids)
      .returns<ProfileRow[]>(),
    admin
      .from("user_progress")
      .select("user_id, xp")
      .in("user_id", ids)
      .returns<{ user_id: string; xp: number }[]>(),
    admin
      .from("user_activity")
      .select("user_id, day")
      .in("user_id", ids)
      .eq("trained", true)
      .gte(
        "day",
        new Date(Date.now() - STREAK_WINDOW_DAYS * 86400000).toISOString().slice(0, 10),
      )
      .returns<{ user_id: string; day: string }[]>(),
  ]);

  const nameOf = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
  const xpOf = new Map(progress?.map((p) => [p.user_id, p.xp]) ?? []);
  const daysOf = new Map<string, string[]>();
  for (const a of activity ?? []) {
    const list = daysOf.get(a.user_id) ?? [];
    list.push(a.day);
    daysOf.set(a.user_id, list);
  }

  const build = (l: (typeof links)[number]): Partner => {
    const other = otherOf(l);
    const p = nameOf.get(other);
    return {
      id: l.id,
      userId: other,
      name: p?.display_name ?? null,
      avatarUrl: p?.avatar_url ?? null,
      streak: streakFrom(daysOf.get(other) ?? []),
      xp: xpOf.get(other) ?? 0,
    };
  };

  return {
    friends: links.filter((l) => l.status === "accepted").map(build),
    /* Only requests waiting on you. Your own outgoing ones are not something
       you can act on, and listing them as "pending" reads like a to-do. */
    pending: links
      .filter((l) => l.status === "pending" && l.addressee_id === userId)
      .map((l) => ({ ...build(l), incoming: true })),
  };
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const [code, lists] = await Promise.all([myCode(user.id), partnersFor(user.id)]);
  return NextResponse.json({ code, ...lists });
}

/** Send a request, by friend code or by email. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { code?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const admin = createAdminClient();
  let targetId: string | null = null;

  if (typeof body.code === "string" && body.code.trim()) {
    const code = normaliseFriendCode(body.code);
    if (!code) return NextResponse.json({ error: "bad_code" }, { status: 400 });
    const { data } = await admin
      .from("user_profiles")
      .select("user_id")
      .eq("friend_code", code)
      .maybeSingle<{ user_id: string }>();
    /* A code is a secret the owner chose to hand out, so "no such code" is
       safe to say -- unlike an email, guessing codes tells you nothing about
       who has an account. */
    if (!data) return NextResponse.json({ error: "no_such_code" }, { status: 404 });
    targetId = data.user_id;
  } else if (typeof body.email === "string" && looksLikeEmail(body.email.trim())) {
    const { data } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("email", body.email.trim().toLowerCase())
      .maybeSingle<{ user_id: string }>();
    targetId = data?.user_id ?? null;
    // deliberately no early return: see the note at the top of the file
  } else {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!targetId || targetId === user.id) {
    /* Nobody to link to, or yourself. Both answer the same as success when the
       lookup was by email; a code lookup already returned above. */
    return NextResponse.json({ ok: true, sent: true });
  }

  const { count } = await admin
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted");
  if ((count ?? 0) >= MAX_FRIENDS) {
    return NextResponse.json({ error: "too_many_friends" }, { status: 409 });
  }

  const { error } = await admin
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: targetId, status: "pending" });

  if (error) {
    /* 23505 is the pair index: a link already exists in one direction or the
       other. Saying so is fine -- they already know this person. */
    if (error.code === "23505") {
      return NextResponse.json({ error: "already_linked" }, { status: 409 });
    }
    console.error("[friend_request]", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sent: true });
}

/** Accept or decline a request that was sent to you. */
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
  const action = body.action === "accept" ? "accepted" : body.action === "decline" ? "declined" : null;
  if (!Number.isFinite(id) || !action) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  /* addressee_id in the filter is the authorisation: only the person a request
     was sent to can answer it, so a guessed id changes nothing. */
  const { data, error } = await createAdminClient()
    .from("friendships")
    .update({ status: action, responded_at: new Date().toISOString() })
    .eq("id", id)
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle<{ id: number }>();

  if (error) {
    console.error("[friend_respond]", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true, status: action });
}

/** Remove a partner, from either side. */
export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  await createAdminClient()
    .from("friendships")
    .delete()
    .eq("id", id)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  return NextResponse.json({ ok: true });
}
