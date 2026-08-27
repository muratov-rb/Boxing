import { NextResponse } from "next/server";
import { resolveCaller } from "@/lib/entitlements-server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { paddle, billingConfigured, priceIdFor } from "@/lib/billing";
import type { PaidPlanId, BillingPeriod } from "@/lib/subscription";

export const runtime = "nodejs";

const PLANS: PaidPlanId[] = ["budget", "pro", "max"];
const PERIODS: BillingPeriod[] = ["monthly", "yearly"];

/* Start a checkout.

   The client asks for a tier and a cadence; the price comes from our own
   environment, never from the request. That distinction is the whole point —
   if the browser could name the price, it could name a cheaper one. */
export async function POST(req: Request) {
  const caller = await resolveCaller();
  if (!caller) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }
  if (caller.banned) {
    return NextResponse.json({ error: "account_closed" }, { status: 403 });
  }
  if (!billingConfigured() || !serviceRoleConfigured()) {
    return NextResponse.json({ error: "billing_off" }, { status: 503 });
  }

  let body: { plan?: string; period?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const plan = body.plan as PaidPlanId;
  const period = (body.period ?? "monthly") as BillingPeriod;
  if (!PLANS.includes(plan) || !PERIODS.includes(period)) {
    return NextResponse.json({ error: "bad_plan" }, { status: 400 });
  }

  const priceId = priceIdFor(plan, period);
  if (!priceId) {
    return NextResponse.json({ error: "price_not_configured" }, { status: 503 });
  }

  const api = paddle();
  const db = createAdminClient();

  try {
    /* Reuse this account's Paddle customer if it has one. A second customer
       for the same person splits their billing history and leaves the portal
       showing only half of it. */
    const { data: row } = await db
      .from("subscriptions")
      .select("billing_customer_id")
      .eq("user_id", caller.userId)
      .maybeSingle<{ billing_customer_id: string | null }>();

    let customerId = row?.billing_customer_id ?? null;
    if (!customerId && caller.email) {
      const customer = await api.customers.create({
        email: caller.email,
        customData: { user_id: caller.userId },
      });
      customerId = customer.id;
      await db
        .from("subscriptions")
        .update({ billing_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq("user_id", caller.userId);
    }

    const origin = new URL(req.url).origin;
    const txn = await api.transactions.create({
      items: [{ priceId, quantity: 1 }],
      ...(customerId ? { customerId } : {}),
      /* Stamped on the transaction so the webhook can identify the account
         from the event alone, without a lookup that might not resolve. */
      customData: { user_id: caller.userId, plan, period },
      checkout: { url: `${origin}/dashboard?checkout=success` },
    });

    const url = txn.checkout?.url;
    if (!url) {
      /* Almost always the same cause: no default payment link is set under
         Paddle → Checkout settings, so Paddle has no page to send them to. */
      return NextResponse.json({ error: "no_checkout_url" }, { status: 503 });
    }
    return NextResponse.json({ url });
  } catch (e) {
    // logged, not returned: the message can carry Supabase/Paddle internals
    console.error("[checkout_failed]", e);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
