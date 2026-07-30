import "server-only";
import Stripe from "stripe";
import type { PaidPlanId, BillingPeriod } from "./subscription";

/* ===========================================================================
   RINGBORNN — Stripe wiring.

   Everything here is server-only. The secret key never reaches the browser,
   and card details never reach us at all: checkout happens on Stripe's own
   hosted page, so this app never sees a card number.

   The app runs perfectly well without any of these variables set — billing
   just stays switched off, exactly as it has been. That is deliberate: a
   missing key should degrade the product, not break it.
   =========================================================================== */

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY?.trim();
}

let cached: Stripe | null = null;

export function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  /* No apiVersion pin: the SDK ships with the version it was built against,
     and hard-coding a different one is how you get type errors on upgrade. */
  if (!cached) cached = new Stripe(key);
  return cached;
}

/* ------------------------------- price ids -------------------------------- */

/** One Stripe price per tier per cadence — six in total. Read at call time so
    a deploy that gains the variables starts working without a code change. */
function priceEnvName(plan: PaidPlanId, period: BillingPeriod): string {
  return `STRIPE_PRICE_${plan.toUpperCase()}_${period.toUpperCase()}`;
}

export function priceIdFor(plan: PaidPlanId, period: BillingPeriod): string | null {
  const raw = process.env[priceEnvName(plan, period)];
  return raw?.trim() || null;
}

/** Which of the six prices are actually configured — used by the pricing page
    to avoid offering a "Subscribe" button that would 500 on click. */
export function configuredPrices(): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const plan of ["budget", "pro", "max"] as PaidPlanId[]) {
    for (const period of ["monthly", "yearly"] as BillingPeriod[]) {
      out[`${plan}_${period}`] = priceIdFor(plan, period) !== null;
    }
  }
  return out;
}

/** Reverse lookup: Stripe tells us a price id, we need the plan it sold. */
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

/* ------------------------------- webhooks --------------------------------- */

export function webhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

/** Statuses that should keep a paid plan switched on. Stripe keeps a
    subscription alive through a failed payment for a while ("past_due") — we
    follow that rather than cutting someone off over one declined card. */
export const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);
