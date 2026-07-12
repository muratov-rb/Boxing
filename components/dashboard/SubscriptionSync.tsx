"use client";

import { useEffect } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { applyServerSub, exportSubState, activePlan } from "@/lib/tracking";

/* Keeps the subscription state in step with Supabase for signed-in users:
   - if the server has a row for this user, it wins (this is how admin-panel
     changes reach the app);
   - otherwise the current local state is pushed up so the user appears in
     the admin panel.
   Renders nothing; safe when Supabase isn't configured. */

export function SubscriptionSync() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const run = async () => {
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) return;

        const { data: row } = await supabase
          .from("subscriptions")
          .select("plan, trial_start")
          .eq("user_id", user.id)
          .maybeSingle();

        if (row) {
          applyServerSub(row.plan, row.trial_start);
        } else {
          const local = exportSubState();
          await supabase.from("subscriptions").insert({
            user_id: user.id,
            email: user.email,
            plan: local.plan ?? activePlan(), // 'trial' or 'expired' when unpaid
            trial_start: local.trialStart,
          });
        }
      } catch {
        /* offline / table missing — local state keeps working */
      }
    };
    run();
  }, []);

  return null;
}
