import { NextResponse } from "next/server";
import { resolveCaller } from "@/lib/entitlements-server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { startingXp, rankFromXp } from "@/lib/xp";
import type { Profile } from "@/lib/onboarding";

export const runtime = "nodejs";

/* The one-time head start for people who already box.

   The path is read from the stored profile rather than the request body. It is
   still self-declared — nothing can verify that someone has really boxed — but
   taking it from the row means the claim has to survive onboarding rather than
   being asserted by whoever calls this endpoint.

   grant_starting_xp records that it happened, so calling this repeatedly does
   nothing after the first time. */
export async function POST() {
  const caller = await resolveCaller();
  if (!caller) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }
  if (caller.banned) {
    return NextResponse.json({ error: "account_closed" }, { status: 403 });
  }
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("user_profiles")
    .select("profile")
    .eq("user_id", caller.userId)
    .maybeSingle<{ profile: Profile | null }>();

  /* No profile synced yet — the client will call again once it has pushed one,
     and the grant is idempotent, so waiting costs nothing. */
  const path = row?.profile?.path;
  if (path !== "beginner" && path !== "experienced") {
    return NextResponse.json({ granted: false, reason: "no_profile" });
  }

  try {
    const { data, error } = await supabase.rpc("grant_starting_xp", {
      p_user: caller.userId,
      p_path: path,
      p_floor: startingXp(path),
    });
    if (error) throw error;

    const xp = typeof data === "number" ? data : 0;
    return NextResponse.json({ granted: true, path, xp, rank: rankFromXp(xp) });
  } catch {
    return NextResponse.json({ error: "grant_failed" }, { status: 500 });
  }
}
