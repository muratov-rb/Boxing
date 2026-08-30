import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { cohortRetention } from "@/lib/admin-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Cohort retention, computed on the server.

   Loaded on demand rather than with the panel: it reads every training day for
   every account, which is the largest query the admin makes, and it is not the
   thing you open the panel to check. The rest of the dashboard must not wait
   on it.

   trial_start doubles as the signup date -- the row is created when the
   account is, so the two are the same day. */

const WEEKS = 5; // signup week plus four after it

export async function GET() {
  if (!(await currentAdmin())) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "no_service_key" }, { status: 503 });
  }

  const db = createAdminClient();

  const { data: subs, error: subErr } = await db
    .from("subscriptions")
    .select("user_id, trial_start, banned")
    .limit(5000)
    .returns<{ user_id: string; trial_start: string; banned: boolean }[]>();

  if (subErr) {
    console.error("[cohorts_subs]", subErr);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const { data: activity, error: actErr } = await db
    .from("user_activity")
    .select("user_id, day")
    .eq("trained", true)
    .limit(50000)
    .returns<{ user_id: string; day: string }[]>();

  if (actErr) {
    console.error("[cohorts_activity]", actErr);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const signups = (subs ?? [])
    .filter((s) => !s.banned && s.trial_start)
    .map((s) => ({ user_id: s.user_id, signup: s.trial_start }));

  return NextResponse.json({
    weeks: WEEKS,
    cohorts: cohortRetention(signups, activity ?? [], WEEKS).slice(0, 12),
  });
}
