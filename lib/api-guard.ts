import "server-only";
import { NextResponse } from "next/server";
import { resolveCaller, type Caller } from "./entitlements-server";
import { spendQuota, type QuotaKey, type QuotaVerdict } from "./usage-server";

/* ===========================================================================
   One gate for the AI endpoints.

   These routes send images and profiles to Anthropic, which costs money per
   call. They were open to the whole internet: no sign-in, no plan check, no
   quota — the gating lived entirely in the browser, where anyone could skip
   it by calling the endpoint directly.

   Every expensive route now starts here.
   =========================================================================== */

export interface Denied {
  response: NextResponse;
}

export function isDenied(x: Caller | Denied): x is Denied {
  return (x as Denied).response !== undefined;
}

/**
 * Establish who is calling and whether their plan may spend one unit of the
 * given quota. Returns the caller, or the response to send back.
 */
export async function guardAiRoute(
  quota: QuotaKey | null,
): Promise<Caller | Denied> {
  const caller = await resolveCaller();

  if (!caller) {
    return {
      response: NextResponse.json({ error: "sign_in_required" }, { status: 401 }),
    };
  }
  if (caller.banned) {
    return {
      response: NextResponse.json({ error: "account_closed" }, { status: 403 }),
    };
  }

  if (quota) {
    const verdict = await spendQuota(caller, quota);
    if (!verdict.allowed) return { response: quotaDenied(caller, verdict) };
  }

  return caller;
}

/**
 * The response for a quota that will not allow this call.
 *
 * Exported because a route that spends its quota late — after validating the
 * request, so a rejected image never costs a scan — still has to answer the
 * same way this guard does. One shape, one place.
 */
export function quotaDenied(caller: Caller, verdict: QuotaVerdict): NextResponse {
  return NextResponse.json(
    {
      // "locked" = your plan never had this; "used up" = come back tomorrow
      error: verdict.locked ? "plan_locked" : "daily_limit",
      used: verdict.used,
      limit: verdict.limit,
      plan: caller.plan,
    },
    { status: verdict.locked ? 402 : 429 },
  );
}
