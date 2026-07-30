import { NextResponse } from "next/server";
import { resolveCaller } from "@/lib/entitlements-server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { stripeClient, stripeConfigured, priceIdFor } from "@/lib/stripe";
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
  if (!stripeConfigured() || !serviceRoleConfigured()) {
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

  const price = priceIdFor(plan, period);
  if (!price) {
    return NextResponse.json({ error: "price_not_configured" }, { status: 503 });
  }

  const stripe = stripeClient();
  const db = createAdminClient();

  try {
    /* Reuse this account's Stripe customer if it has one. Creating a second
       customer for the same person splits their billing history and makes the
       portal show only half of it. */
    const { data: row } = await db
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", caller.userId)
      .maybeSingle<{ stripe_customer_id: string | null }>();

    let customerId = row?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: caller.email ?? undefined,
        metadata: { user_id: caller.userId },
      });
      customerId = customer.id;
      await db
        .from("subscriptions")
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq("user_id", caller.userId);
    }

    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/plans?checkout=cancelled`,
      allow_promotion_codes: true,
      /* Stamped on the subscription so the webhook can identify the account
         even if the session object is long gone by the time it arrives. */
      subscription_data: { metadata: { user_id: caller.userId, plan, period } },
      metadata: { user_id: caller.userId, plan, period },
    });

    if (!session.url) throw new Error("no checkout url");
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json(
      { error: "checkout_failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
