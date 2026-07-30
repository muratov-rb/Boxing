import { NextResponse } from "next/server";
import { resolveCaller } from "@/lib/entitlements-server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { stripeClient, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

/* Cancelling, changing card, downloading invoices.

   All of it happens on Stripe's own customer portal rather than screens we
   would have to build and keep correct. It also means the terms' promise that
   you can cancel at any time is a link, not a support request. */
export async function POST(req: Request) {
  const caller = await resolveCaller();
  if (!caller) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }
  if (!stripeConfigured() || !serviceRoleConfigured()) {
    return NextResponse.json({ error: "billing_off" }, { status: 503 });
  }

  const { data: row } = await createAdminClient()
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", caller.userId)
    .maybeSingle<{ stripe_customer_id: string | null }>();

  if (!row?.stripe_customer_id) {
    return NextResponse.json({ error: "no_customer" }, { status: 404 });
  }

  try {
    const session = await stripeClient().billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${new URL(req.url).origin}/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json(
      { error: "portal_failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
