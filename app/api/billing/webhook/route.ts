import { NextResponse } from "next/server";
import { EventName } from "@paddle/paddle-node-sdk";
import type { Subscription } from "@paddle/paddle-node-sdk";
import {
  paddle,
  billingConfigured,
  webhookSecret,
  planFromPriceId,
  ACTIVE_STATUSES,
} from "@/lib/billing";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/* ===========================================================================
   Paddle's word on who has paid.

   This is the only place a paid plan is granted. Not the client, not the
   success page — a browser redirected to /dashboard?checkout=success proves
   nothing, since anyone can type that URL. Only a signature-verified event
   from Paddle counts.

   The signature check is therefore load-bearing, not ceremony: without it this
   endpoint would hand out Max subscriptions to anyone who could POST JSON.
   =========================================================================== */

async function applySubscription(sub: Subscription): Promise<void> {
  const db = createAdminClient();

  const priceId = sub.items?.[0]?.price?.id ?? "";
  const mapped = planFromPriceId(priceId);
  const active = ACTIVE_STATUSES.has(sub.status);

  /* Prefer the id we stamped at checkout; fall back to the customer, which
     covers subscriptions created or changed inside Paddle's dashboard. */
  const custom = sub.customData as { user_id?: string } | null | undefined;
  const userId = custom?.user_id;

  const patch: Record<string, unknown> = {
    billing_subscription_id: sub.id,
    billing_status: sub.status,
    current_period_end: sub.currentBillingPeriod?.endsAt ?? null,
    cancel_at_period_end: sub.scheduledChange?.action === "cancel",
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
    : await q.eq("billing_customer_id", sub.customerId);
  if (error) throw error;
}

export async function POST(req: Request) {
  const secret = webhookSecret();
  if (!billingConfigured() || !secret || !serviceRoleConfigured()) {
    return NextResponse.json({ error: "billing_off" }, { status: 503 });
  }

  const signature = req.headers.get("paddle-signature");
  if (!signature) {
    return NextResponse.json({ error: "no_signature" }, { status: 400 });
  }

  /* The raw body is required — parsing it first would change the bytes the
     signature was computed over and every event would fail verification. */
  const raw = await req.text();

  let event;
  try {
    event = await paddle().webhooks.unmarshal(raw, secret, signature);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }
  if (!event) {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  try {
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionActivated:
      case EventName.SubscriptionUpdated:
      case EventName.SubscriptionCanceled:
      case EventName.SubscriptionPastDue:
      case EventName.SubscriptionPaused:
      case EventName.SubscriptionResumed:
        await applySubscription(event.data as Subscription);
        break;

      default:
        break; // everything else is noise for our purposes
    }
  } catch (e) {
    /* 500 asks Paddle to retry. Better a duplicate update — they are
       idempotent — than silently losing someone's upgrade. */
    return NextResponse.json(
      { error: "handler_failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
