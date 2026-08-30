import { NextResponse } from "next/server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/user";
import { TRIAL_DAYS } from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Creates the subscription row for an account that does not have one yet.

   This used to happen in the browser, which meant the client chose the plan it
   was inserting -- and it inserted whatever was in localStorage. A user who
   had clicked "Max" while billing was switched off got `max` written to the
   database as fact, and it stayed there.

   The plan is decided here now, and it is never a paid one. Only the Paddle
   webhook may write budget/pro/max, because only the webhook knows a payment
   actually happened. */

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("subscriptions")
    .select("plan, period, trial_start, banned")
    .eq("user_id", user.id)
    .maybeSingle<{ plan: string; period: string; trial_start: string; banned: boolean }>();

  if (existing) return NextResponse.json(existing);

  /* The trial clock starts when the account is created, not when the browser
     says it did -- otherwise clearing localStorage restarts it forever. */
  const row = {
    user_id: user.id,
    email: user.email,
    plan: "trial",
    period: "monthly",
    trial_start: new Date().toISOString().slice(0, 10),
  };

  const { error } = await admin.from("subscriptions").insert(row);
  if (error) {
    console.error("[subscription_ensure]", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ...row, banned: false, trialDays: TRIAL_DAYS });
}
