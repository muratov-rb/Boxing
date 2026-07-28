import "server-only";
import { createClient } from "./supabase/server";
import { createAdminClient, serviceRoleConfigured } from "./supabase/admin";
import {
  entitlementsFor,
  TRIAL_DAYS,
  type Entitlements,
  type PlanId,
} from "./subscription";

/* ===========================================================================
   Whose plan is it, really?

   Until now every gate in the app was decided in the browser: the client read
   its own localStorage, decided it was on Max, and no server ever checked. The
   AI routes cost real money per call, so that answer has to come from the
   database instead.

   Nothing here trusts anything the client sends — not the plan, not the user
   id. The identity comes from the session cookie; the plan comes from the
   subscriptions row.
   =========================================================================== */

export interface Caller {
  userId: string;
  email: string | null;
  plan: PlanId;
  entitlements: Entitlements;
  banned: boolean;
}

/** Resolve the signed-in user and their real plan, or null if not signed in. */
export async function resolveCaller(): Promise<Caller | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  /* Read the row with the service key where we can: a banned user's own
     session must not be able to hide their banned flag from us, and RLS
     could be tightened later without silently breaking this check. */
  const db = serviceRoleConfigured() ? createAdminClient() : supabase;
  const { data } = await db
    .from("subscriptions")
    .select("plan, trial_start, banned")
    .eq("user_id", user.id)
    .maybeSingle<{ plan: string; trial_start: string; banned: boolean }>();

  const plan = resolvePlan(data?.plan, data?.trial_start, data?.banned);
  return {
    userId: user.id,
    email: user.email ?? null,
    plan,
    entitlements: entitlementsFor(plan),
    banned: data?.banned ?? false,
  };
}

/** The stored plan, with the trial expired by the calendar rather than by the
    client's word, and a ban overriding everything. Exported for testing. */
export function resolvePlan(
  stored: string | undefined,
  trialStart: string | undefined,
  banned: boolean | undefined,
  today = new Date(),
): PlanId {
  if (banned) return "expired";
  if (stored === "budget" || stored === "pro" || stored === "max") return stored;

  if (!trialStart) return "expired";
  const started = new Date(`${trialStart}T00:00:00Z`).getTime();
  if (!Number.isFinite(started)) return "expired";

  const dayMs = 86_400_000;
  const startOfToday = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const elapsed = Math.floor((startOfToday - started) / dayMs);
  return elapsed < TRIAL_DAYS ? "trial" : "expired";
}
