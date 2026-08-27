import { NextResponse } from "next/server";
import { resolveCaller } from "@/lib/entitlements-server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { paddle, billingConfigured } from "@/lib/billing";

export const runtime = "nodejs";

/* Cancelling, changing card, downloading invoices.

   All of it happens on Paddle's own customer portal rather than screens we
   would have to build and keep correct. It also means the terms' promise that
   you can cancel at any time is a link, not a support request. */
export async function POST() {
  const caller = await resolveCaller();
  if (!caller) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }
  if (!billingConfigured() || !serviceRoleConfigured()) {
    return NextResponse.json({ error: "billing_off" }, { status: 503 });
  }

  const { data: row } = await createAdminClient()
    .from("subscriptions")
    .select("billing_customer_id, billing_subscription_id")
    .eq("user_id", caller.userId)
    .maybeSingle<{
      billing_customer_id: string | null;
      billing_subscription_id: string | null;
    }>();

  if (!row?.billing_customer_id) {
    return NextResponse.json({ error: "no_customer" }, { status: 404 });
  }

  try {
    const session = await paddle().customerPortalSessions.create(
      row.billing_customer_id,
      row.billing_subscription_id ? [row.billing_subscription_id] : [],
    );
    return NextResponse.json({ url: session.urls.general.overview });
  } catch (e) {
    // logged, not returned: the message can carry Supabase/Paddle internals
    console.error("[portal_failed]", e);
    return NextResponse.json({ error: "portal_failed" }, { status: 500 });
  }
}
