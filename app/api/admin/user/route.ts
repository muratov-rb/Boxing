import { NextResponse } from "next/server";
import { currentAdmin, auditAdmin } from "@/lib/admin-auth";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Action = "setPlan" | "restartTrial" | "ban" | "unban";

const PLANS = ["trial", "budget", "pro", "max", "expired"];
const PERIODS = ["monthly", "yearly"];

/* Admin actions on a single user. Guarded by the admin cookie and run with the
   service-role key server-side; the key never reaches the browser. */
export async function POST(req: Request) {
  const actor = await currentAdmin();
  if (!actor) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  let body: { userId?: string; action?: Action; plan?: string; period?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { userId, action } = body;
  if (!userId || !action) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  /* No role check here any more. There is no reduced tier to guard against:
     every admin is an owner, because an account that can move subscriptions
     can hand out free plans anyway. What protects a ban is that it is behind
     the login at all, plus the audit line naming who did it. */

  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "no_service_key" }, { status: 503 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  try {
    switch (action) {
      case "setPlan": {
        const plan = body.plan ?? "";
        const period = body.period ?? "monthly";
        if (!PLANS.includes(plan) || !PERIODS.includes(period)) {
          return NextResponse.json({ error: "bad_plan" }, { status: 400 });
        }
        /* "Trial" has to start the clock again, not just write the word.
           Whether a trial is running is decided by trial_start and the
           calendar, everywhere: the app, the AI routes, this panel. Setting
           the plan back to "trial" on an account whose seven days were
           already up changed the label here and nothing else - the person
           stayed locked out, which is exactly what was reported. */
        const patch: Record<string, string> = { plan, period, updated_at: now };
        if (plan === "trial") patch.trial_start = now.slice(0, 10);
        const { data, error } = await supabase
          .from("subscriptions")
          .update(patch)
          .eq("user_id", userId)
          .select("user_id");
        if (error) throw error;
        if (!data?.length) return NextResponse.json({ error: "no_such_user" }, { status: 404 });
        await auditAdmin(actor, "setPlan", userId, {
          plan,
          period,
          ...(patch.trial_start ? { trial_start: patch.trial_start } : {}),
        });
        return NextResponse.json({ ok: true, plan, period });
      }

      case "restartTrial": {
        const today = now.slice(0, 10);
        /* An update that matches no row is not an error to Supabase, so it
           is checked: "saved" must mean a row changed. */
        const { data, error } = await supabase
          .from("subscriptions")
          .update({ plan: "trial", trial_start: today, updated_at: now })
          .eq("user_id", userId)
          .select("user_id");
        if (error) throw error;
        if (!data?.length) return NextResponse.json({ error: "no_such_user" }, { status: 404 });
        await auditAdmin(actor, "restartTrial", userId, { trial_start: today });
        return NextResponse.json({ ok: true, trial_start: today });
      }

      case "ban": {
        /* Deliberately destructive: blocks access AND deletes the user's
           training data. There is no undo — unbanning restores access, not
           progress. The UI asks for confirmation before calling this.

           The lock is enforced by Supabase Auth itself (ban_duration), so the
           account cannot sign in or refresh its token; the flag on the row is
           what the panel and the app read. */
        const { error } = await supabase
          .from("subscriptions")
          .update({ banned: true, banned_at: now, plan: "expired", updated_at: now })
          .eq("user_id", userId);
        if (error) throw error;

        await supabase.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
        await Promise.all([
          supabase.from("user_activity").delete().eq("user_id", userId),
          supabase.from("user_progress").delete().eq("user_id", userId),
          supabase.from("user_profiles").delete().eq("user_id", userId),
        ]);
        await auditAdmin(actor, "ban", userId, { dataWiped: true });
        return NextResponse.json({ ok: true, banned: true, dataWiped: true });
      }

      case "unban": {
        const { error } = await supabase
          .from("subscriptions")
          /* The ban wrote "expired" over the plan. Left there, the account
             would come back locked whatever was left of its trial, so it is
             handed back to the trial clock, which is where it stood before
             "expired" started to mean something on its own. */
          .update({ banned: false, banned_at: null, plan: "trial", updated_at: now })
          .eq("user_id", userId);
        if (error) throw error;
        await supabase.auth.admin.updateUserById(userId, { ban_duration: "none" });
        await auditAdmin(actor, "unban", userId, {});
        return NextResponse.json({ ok: true, banned: false });
      }

      default:
        return NextResponse.json({ error: "unknown_action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "action_failed" }, { status: 500 });
  }
}
