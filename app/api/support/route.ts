import { NextResponse } from "next/server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/user";
import { clientKey } from "@/lib/rate-limit";
import {
  EMAIL_MAX,
  MAX_PER_HOUR,
  MESSAGE_MAX,
  MESSAGE_MIN,
  isTopic,
  looksLikeEmail,
} from "@/lib/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Filing a support request.

   Open to signed-out callers on purpose: the person who cannot log in, or
   whose payment failed before an account existed, is precisely who needs this.
   That openness is what the per-source hourly cap pays for.

   The reply address is asked for rather than taken from the session, because a
   signed-in user may well be writing about the fact that their account email
   is the thing that is wrong. */
export async function POST(req: Request) {
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { email?: string; topic?: string; message?: string; page?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().slice(0, EMAIL_MAX);
  const message = (body.message ?? "").trim().slice(0, MESSAGE_MAX);
  const topic = isTopic(body.topic) ? body.topic : "other";

  if (!looksLikeEmail(email)) {
    return NextResponse.json({ error: "bad_email" }, { status: 400 });
  }
  if (message.length < MESSAGE_MIN) {
    return NextResponse.json({ error: "message_too_short" }, { status: 400 });
  }

  const admin = createAdminClient();
  const who = clientKey(req);

  /* Flood check. Counting rows is enough here — unlike a login there is no
     failure to tally, and a head-count query costs one index scan. A database
     problem fails OPEN, because losing a real bug report is worse than
     accepting a duplicate. */
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("client_key", who)
      .gte("created_at", since);

    if ((count ?? 0) >= MAX_PER_HOUR) {
      return NextResponse.json({ error: "too_many" }, { status: 429 });
    }
  } catch {
    /* fall through and accept it */
  }

  /* Best-effort identity: an unauthenticated caller is expected, not an error. */
  const user = await getUser();

  const { data, error } = await admin
    .from("support_tickets")
    .insert({
      user_id: user?.id ?? null,
      email,
      topic,
      message,
      page: (body.page ?? "").slice(0, 300) || null,
      user_agent: (req.headers.get("user-agent") ?? "").slice(0, 400) || null,
      client_key: who,
    })
    .select("id")
    .single<{ id: number }>();

  if (error) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
