"use client";

import { useEffect } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { applyServerSub, exportSubState, activePlan, wipeLocal } from "@/lib/tracking";
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

    let stopSync: (() => void) | undefined;
    let cancelled = false;

    /* Returns true if the account is banned. Checked before any sync runs:
       a banned account's server data has been wiped, and pushing this
       browser's copy back up would quietly undo that. */
    const checkAccount = async (): Promise<boolean> => {
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) return false;

        const { data: row } = await supabase
          .from("subscriptions")
          .select("plan, period, trial_start, banned")
          .eq("user_id", user.id)
          .maybeSingle();

        if (row?.banned) {
          wipeLocal();
          await supabase.auth.signOut();
          window.location.href = "/login?banned=1";
          return true;
        }

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
      return false;
    };

    (async () => {
      if (await checkAccount()) return;
      if (cancelled) return;

      /* pull first so a fresh device adopts existing progress, then push the
         merged result and keep mirroring changes */
      try {
        await pullUserData();
        await pushAll();
      } catch {
        /* offline — local state still works */
      }
      if (!cancelled) stopSync = startSync();
    })();

    return () => {
      cancelled = true;
      stopSync?.();
    };
  }, []);

  return null;
}
