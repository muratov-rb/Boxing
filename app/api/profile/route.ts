import { NextResponse } from "next/server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/user";
import { cleanDisplayName } from "@/lib/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* The parts of a profile the person controls directly: what they are called
   and what they look like.

   These are columns rather than fields inside the existing `profile` jsonb.
   That blob is pushed wholesale by the device sync, so a name typed on a phone
   would be erased by the next push from a laptop holding an older copy. A
   column is written on its own and survives that. */

interface ProfileRow {
  display_name: string | null;
  avatar_url: string | null;
}

/** Falls back to the name captured at signup, which lives on the account. */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { data } = await createAdminClient()
    .from("user_profiles")
    .select("display_name, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  const signupName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : null;

  return NextResponse.json({
    displayName: data?.display_name ?? signupName,
    avatarUrl: data?.avatar_url ?? null,
    email: user.email ?? null,
  });
}

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { displayName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const displayName = cleanDisplayName(body.displayName);
  if (!displayName) return NextResponse.json({ error: "bad_name" }, { status: 400 });

  /* upsert, not update: a user who has never finished onboarding has no
     profile row yet, and should still be able to set their name. */
  const { error } = await createAdminClient()
    .from("user_profiles")
    .upsert(
      { user_id: user.id, display_name: displayName, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) {
    console.error("[profile_patch]", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, displayName });
}
