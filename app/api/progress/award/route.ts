import { NextResponse } from "next/server";
import { resolveCaller } from "@/lib/entitlements-server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import {
  XP_AWARDS,
  DAILY_XP_CAP,
  XP_DECAY_PER_DAY,
  XP_GRACE_DAYS,
  rankFromXp,
} from "@/lib/xp";

export const runtime = "nodejs";

/* Awarding XP.

   The client says WHAT happened ("I finished a workout"); the server decides
   what that is worth, whether the daily cap is already spent, and how much
   idle decay to settle first. Those numbers used to live in the browser next
   to the value they guarded, which meant a rank was a localStorage edit away.

   The database function does the whole read-settle-cap-write under a row lock,
   so two tabs finishing a session at once cannot both bank the full amount. */

export async function POST(req: Request) {
  const caller = await resolveCaller();
  if (!caller) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }
  if (caller.banned) {
    return NextResponse.json({ error: "account_closed" }, { status: 403 });
  }
  if (!serviceRoleConfigured()) {
    // no server-side store; the client keeps its local copy and syncs later
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  let body: { kind?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const kind = body.kind ?? "";
  if (!Object.prototype.hasOwnProperty.call(XP_AWARDS, kind)) {
    return NextResponse.json({ error: "unknown_kind" }, { status: 400 });
  }

  try {
    const { data, error } = await createAdminClient().rpc("award_xp", {
      p_user: caller.userId,
      p_today: new Date().toISOString().slice(0, 10),
      p_amount: XP_AWARDS[kind as keyof typeof XP_AWARDS],
      p_daily_cap: DAILY_XP_CAP,
      p_decay: XP_DECAY_PER_DAY,
      p_grace: XP_GRACE_DAYS,
    });
    if (error) throw error;

    const xp = typeof data === "number" ? data : 0;
    return NextResponse.json({ xp, rank: rankFromXp(xp) });
  } catch {
    return NextResponse.json({ error: "award_failed" }, { status: 500 });
  }
}
