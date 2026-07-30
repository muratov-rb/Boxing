import "server-only";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import type { PaidPlanId, BillingPeriod } from "./subscription";

/* ===========================================================================
   RINGBORNN — billing, via Paddle.

   Paddle rather than Stripe because Stripe does not operate in Uzbekistan, and
   Paddle onboards sellers anywhere outside its sanctions list. It is also a
   Merchant of Record: Paddle is the legal seller, so it collects and remits US
   state sales tax, EU VAT and UK VAT rather than leaving a one-person company
   to track nexus rules in fifty states.

   Server-only. Card details never reach this app — checkout happens on
   Paddle's own page — and the API key never reaches the browser.

   With no keys set the whole thing stays switched off and the pricing page
   falls back to recording a choice locally, exactly as it did before. A
   missing key should degrade the product, not break it.
   =========================================================================== */

export function billingConfigured(): boolean {
  return !!process.env.PADDLE_API_KEY?.trim();
}

let cached: Paddle | null = null;

export function paddle(): Paddle {
  const key = process.env.PADDLE_API_KEY?.trim();
  if (!key) throw new Error("PADDLE_API_KEY is not set");
  if (!cached) {
    /* Sandbox unless explicitly told otherwise, so a misconfigured deploy
       takes fake cards rather than real ones. */
    const live = process.env.PADDLE_ENV?.trim() === "production";
    cached = new Paddle(key, {
      environment: live ? Environment.production : Environment.sandbox,
    });
  }
  return cached;
}

/* ------------------------------- price ids -------------------------------- */

/** One Paddle price per tier per cadence — six in total. Read at call time so
    a deploy that gains the variables starts working without a code change. */
export function priceIdFor(plan: PaidPlanId, period: BillingPeriod): string | null {
  const raw = process.env[`PADDLE_PRICE_${plan.toUpperCase()}_${period.toUpperCase()}`];
  return raw?.trim() || null;
}

/** Reverse lookup: Paddle tells us a price id, we need the plan it sold. */
export function planFromPriceId(
  priceId: string,
): { plan: PaidPlanId; period: BillingPeriod } | null {
  for (const plan of ["budget", "pro", "max"] as PaidPlanId[]) {
    for (const period of ["monthly", "yearly"] as BillingPeriod[]) {
      if (priceIdFor(plan, period) === priceId) return { plan, period };
    }
  }
  return null;
}

/* -------------------------------- webhooks -------------------------------- */

export function webhookSecret(): string | null {
  return process.env.PADDLE_WEBHOOK_SECRET?.trim() || null;
}

/** Subscription states that should keep a paid plan switched on. Paddle keeps
    a subscription alive through a failed payment for a while ("past_due") — we
    follow that rather than cutting someone off over one declined card. */
export const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);
