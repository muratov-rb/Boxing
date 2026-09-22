"use client";

import { useEffect } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { applyServerSub, wipeLocal, applyServerXp } from "@/lib/tracking";
import { pullUserData, pushAll, startSync } from "@/lib/sync";

/* Keeps a signed-in user's data in step with Supabase:
   - subscription: the server row wins (this is how admin-panel changes reach
     the app), or local state is pushed up so the user appears in the panel;
   - tracking data (profile, streak, XP, meals, usage): pulled and merged on
     load, then mirrored on every change so progress follows the account
     instead of the browser.
   Renders nothing; safe when Supabase isn't configured.

   WHERE IT RUNS. This used to be rendered by the dashboard page alone, and
   stopped the mirror when the dashboard unmounted. Meals are logged on
   /calories and workouts on /train, so the one page that was never syncing was
   the page where the thing being synced happened: anything logged there waited
   for the next visit to the dashboard, or for ever. It is now mounted by
   AppNav, which every signed-in page renders.

   ONCE PER PAGE LOAD. AppNav remounts on every navigation, and this must not:
   the ban check, the subscription read, the pull and the full push are a
   handful of round trips each, and repeating them on every tap between tabs
   would be pure cost. So the work lives at module level behind a promise, and
   the mirror is never stopped by an unmount — it lives as long as the page.
   Signing in and out are full navigations (the sign-out route answers with a
   303), which reset the module, so a second account can never inherit it. */

/* Returns true if the account is banned. Checked before any sync runs: a
   banned account's server data has been wiped, and pushing this browser's
   copy back up would quietly undo that. The mirror only starts once this has
   passed, on any page — which is why it could not simply be started from
   AppNav on its own. */
async function checkAccount(userId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: row } = await supabase
      .from("subscriptions")
      .select("plan, period, trial_start, banned")
      .eq("user_id", userId)
      .maybeSingle();

    if (row?.banned) {
      wipeLocal();
      await supabase.auth.signOut();
      /* A full navigation, NOT router.push, despite the lint rule against it.
         The sync mirror is never stopped once started, so the only thing that
         ends it is discarding the page. A client-side push would keep it
         running on a signed-out, wiped browser. */
      window.location.href = "/login?banned=1";
      return true;
    }

    if (row) {
      applyServerSub(row.plan, row.trial_start, row.period);
    } else {
      /* The server decides the plan for a new row. This used to insert
         whatever the browser had in localStorage, so anyone who had clicked
         Max while billing was off got it written down as fact. */
      const res = await fetch("/api/subscription/ensure", { method: "POST" });
      if (res.ok) {
        const created = await res.json();
        applyServerSub(created.plan, created.trial_start, created.period);
      }
    }
  } catch {
    /* offline / table missing — local state keeps working */
  }
  return false;
}

let started: Promise<void> | null = null;

function bootstrap(): Promise<void> {
  if (started) return started;
  started = (async () => {
    const { data: auth } = await createClient().auth.getUser();
    const user = auth?.user;
    /* A signed-out visitor on a public page that renders AppNav (/plans):
       nothing to sync, and nothing to call. Cleared so that if the same page
       ever gains a session without a reload, the next mount tries again. */
    if (!user) {
      started = null;
      return;
    }

    if (await checkAccount(user.id)) return;

    /* pull first so a fresh device adopts existing progress, then push the
       merged result and keep mirroring changes */
    try {
      await pullUserData();
      await pushAll();
    } catch {
      /* offline — local state still works */
    }

    /* Claim the experienced head start. Deliberately after pushAll: the server
       reads the path from the stored profile, so the profile has to be up
       there first. Idempotent, so running it on every load is fine. */
    try {
      const res = await fetch("/api/progress/start", { method: "POST" });
      if (res.ok) {
        const { granted, xp } = (await res.json()) as { granted?: boolean; xp?: number };
        if (granted && typeof xp === "number") applyServerXp(xp);
      }
    } catch {
      /* offline — it will be claimed on a later load */
    }

    /* Never stopped. The stop function is discarded on purpose: stopping on
       unmount is exactly the bug this file used to have. */
    startSync();
  })().catch(() => {
    /* Any unexpected throw leaves the door open for the next mount to retry
       rather than wedging sync off for the rest of the page's life. */
    started = null;
  });
  return started;
}

export function SubscriptionSync() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void bootstrap();
    /* No cleanup: see "ONCE PER PAGE LOAD" above. */
  }, []);

  return null;
}

