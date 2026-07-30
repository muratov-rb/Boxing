import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  stripeClient,
  stripeConfigured,
  webhookSecret,
  planFromPriceId,
  ACTIVE_STATUSES,
} from "@/lib/stripe";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/* ===========================================================================
   Stripe's word on who has paid.

   This is the only place a paid plan is granted. Not the client, not the
   success page — a browser redirected to /dashboard?checkout=success proves
   nothing, since anyone can visit that URL. Only a signature-verified event
   from Stripe counts.

   The signature check is therefore load-bearing, not ceremony: without it this
   endpoint would hand out Max subscriptions to anyone who could POST JSON.
   =========================================================================== */

async function applySubscription(sub: Stripe.Subscription): Promise<void> {
  const db = createAdminClient();

  const priceId = sub.items.data[0]?.price?.id ?? "";
  const mapped = planFromPriceId(priceId);
  const active = ACTIVE_STATUSES.has(sub.status);

  /* Prefer the id we stamped at checkout; fall back to the customer, which
     covers subscriptions created or changed from the Stripe dashboard. */
  const userId = sub.metadata?.user_id;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

  const periodEnd = sub.items.data[0]?.current_period_end;
  const patch: Record<string, unknown> = {
    stripe_subscription_id: sub.id,
    stripe_status: sub.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  };

  /* A cancelled or unpaid subscription drops the account back to expired
     rather than leaving it on a tier nobody is paying for. */
  if (active && mapped) {
    patch.plan = mapped.plan;
    patch.period = mapped.period;
  } else if (!active) {
    patch.plan = "expired";
  }

  const q = db.from("subscriptions").update(patch);
  const { error } = userId
    ? await q.eq("user_id", userId)
    : await q.eq("stripe_customer_id", customerId ?? "");
  if (error) throw error;
}

export async function POST(req: Request) {
  const secret = webhookSecret();
  if (!stripeConfigured() || !secret || !serviceRoleConfigured()) {
    return NextResponse.json({ error: "billing_off" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "no_signature" }, { status: 400 });
  }

  /* The raw body is required — parsing it first would change the bytes the
     signature was computed over and every event would fail verification. */
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(raw, signature, secret);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.subscription) {
          const id =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          await applySubscription(await stripeClient().subscriptions.retrieve(id));
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applySubscription(event.data.object);
        break;

      default:
        break; // everything else is noise for our purposes
    }
  } catch (e) {
    /* 500 asks Stripe to retry. Better a duplicate update — they are
       idempotent — than silently losing someone's upgrade. */
    return NextResponse.json(
      { error: "handler_failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
