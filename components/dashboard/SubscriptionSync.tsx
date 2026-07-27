"use client";

import { useEffect } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { applyServerSub, exportSubState, activePlan } from "@/lib/tracking";
import { pullUserData, pushAll, startSync } from "@/lib/sync";

/* Keeps a signed-in user's data in step with Supabase:
   - subscription: the server row wins (this is how admin-panel changes reach
     the app), or local state is pushed up so the user appears in the panel;
   - tracking data (profile, streak, XP, meals, usage): pulled and merged on
     load, then mirrored on every change so progress follows the account
     instead of the browser.
   Renders nothing; safe when Supabase isn't configured. */

export function SubscriptionSync() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    /* pull first so a fresh device adopts existing progress, then push the
       merged result and keep mirroring changes */
    let stopSync: (() => void) | undefined;
    (async () => {
      try {
        await pullUserData();
        await pushAll();
      } catch {
        /* offline — local state still works */
      }
      stopSync = startSync();
    })();

    const run = async () => {
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) return;

        const { data: row } = await supabase
          .from("subscriptions")
          .select("plan, period, trial_start")
          .eq("user_id", user.id)
          .maybeSingle();

        if (row) {
          applyServerSub(row.plan, row.trial_start, row.period);
        } else {
          const local = exportSubState();
          await supabase.from("subscriptions").insert({
            user_id: user.id,
            email: user.email,
            plan: local.plan ?? activePlan(), // 'trial' or 'expired' when unpaid
            period: local.period,
            trial_start: local.trialStart,
          });
        }
      } catch {
        /* offline / table missing — local state keeps working */
      }
    };
    run();

    return () => stopSync?.();
  }, []);

  return null;
}
