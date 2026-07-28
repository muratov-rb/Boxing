import { NextResponse } from "next/server";
import { resolveCaller } from "@/lib/entitlements-server";
import { readQuotas } from "@/lib/usage-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Today's quota state, as the server sees it.

   The UI used to count from localStorage, which is wrong in both directions:
   a second device showed a full allowance that the server would refuse, and a
   cleared browser looked like a fresh day. Reading it costs one query and the
   number matches what the endpoints will actually do. */
export async function GET() {
  const caller = await resolveCaller();
  if (!caller) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }

  const quotas = await readQuotas(caller);
  return NextResponse.json({ plan: caller.plan, quotas });
}
