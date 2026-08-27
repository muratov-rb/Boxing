import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/* Self-serve account deletion — the mechanism behind the promise in the
   privacy policy. Deleting a Supabase auth user needs the service-role key, so
   the work happens here rather than in the browser; the caller proves who they
   are with their own session first, and can only ever delete themselves. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  /* Typing the word is the confirmation. Without it a stray POST — a rogue
     script, a mis-wired button — would wipe the account silently. */
  let body: { confirm?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (body.confirm !== "DELETE") {
    return NextResponse.json({ error: "not_confirmed" }, { status: 400 });
  }

  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "no_service_key" }, { status: 503 });
  }

  const admin = createAdminClient();
  const id = user.id;

  try {
    // data rows first: if deleting the auth user succeeded but these failed,
    // the rows would be orphaned with no account left to claim them
    await Promise.all([
      admin.from("user_activity").delete().eq("user_id", id),
      admin.from("user_progress").delete().eq("user_id", id),
      admin.from("user_profiles").delete().eq("user_id", id),
      admin.from("subscriptions").delete().eq("user_id", id),
    ]);

    /* Support history goes too, or "delete everything" would quietly leave
       their address and whatever they told us sitting in the inbox. Matched by
       email as well as id, because a ticket filed before signing in — or while
       locked out — carries no user_id to match on. */
    await admin.from("support_tickets").delete().eq("user_id", id);
    if (user.email) {
      await admin.from("support_tickets").delete().eq("email", user.email);
    }

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  } catch (e) {
    // logged, not returned: the message can carry Supabase/Paddle internals
    console.error("[delete_failed]", e);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
