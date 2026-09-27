import "server-only";
import { billingConfigured, paddle, planFromPriceId } from "./billing";
import type { BillingPeriod, PaidPlanId } from "./subscription";

/* ===========================================================================
   Which plan a checkout is for, so the checkout page can show it.

   The page only receives Paddle's transaction id (`?_ptxn=`). Asking Paddle
   for that transaction tells us the price, and the price tells us the plan --
   the same mapping the webhook trusts. The summary beside the card form is
   therefore always the plan actually being charged for, not whatever a link
   claims.

   Only shown to the person the transaction was created for: our checkout
   route stamps their user id on it (customData.user_id). A transaction id is
   not guessable, but there is no reason to describe someone's order to
   anybody else holding the link.

   Fails soft: with no answer the page still opens the payment form, just
   without our summary. Paying must never depend on the decoration.
   =========================================================================== */

export interface CheckoutOrder {
  plan: PaidPlanId;
  period: BillingPeriod;
}

/** Paddle transaction ids are "txn_" followed by lowercase letters and
    digits. Anything else is not sent to Paddle's API at all. */
function isTxnId(id: string): boolean {
  if (!id.startsWith("txn_") || id.length > 64 || id.length < 8) return false;
  for (let i = 4; i < id.length; i++) {
    const c = id.charCodeAt(i);
    const digit = c >= 48 && c <= 57;
    const lower = c >= 97 && c <= 122;
    if (!digit && !lower) return false;
  }
  return true;
}

export async function checkoutOrder(
  txnId: string | undefined,
  userId: string | undefined,
): Promise<CheckoutOrder | null> {
  if (!txnId || !userId || !isTxnId(txnId) || !billingConfigured()) return null;
  try {
    const txn = await paddle().transactions.get(txnId);
    const owner = (txn.customData as { user_id?: unknown } | null)?.user_id;
    if (owner !== userId) return null;
    const priceId = txn.items[0]?.price?.id;
    return priceId ? planFromPriceId(priceId) : null;
  } catch (e) {
    console.error("[checkout_order]", e instanceof Error ? e.message : String(e));
    return null;
  }
}
