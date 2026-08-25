import { NextResponse } from "next/server";
import { currentAdmin, auditAdmin } from "@/lib/admin-auth";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import type { SupportStatus } from "@/lib/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: SupportStatus[] = ["new", "open", "done"];

/* Everything people have written in, newest first.

   Unresolved ones sort above finished ones regardless of age, so a ticket
   cannot quietly fall off the bottom of the list while it is still open. */
export async function GET() {
  if (!(await currentAdmin())) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "no_service_key" }, { status: 503 });
  }

  const { data, error } = await createAdminClient()
    .from("support_tickets")
    .select("id, user_id, email, topic, message, page, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });

  /* Priority is applied here, not in SQL: the statuses do not sort into the
     order we want alphabetically, and a CASE expression is not expressible
     through the query builder. Array sort is stable, so within each status the
     newest-first order from the query survives. */
  const rank: Record<string, number> = { new: 0, open: 1, done: 2 };
  const tickets = (data ?? []).sort(
    (a, b) => (rank[a.status] ?? 3) - (rank[b.status] ?? 3),
  );

  return NextResponse.json({ tickets });
}

/* Move a ticket along: new → open while you are dealing with it, done when it
   is finished. Logged, because "who closed this and when" is the question you
   ask when someone writes back saying nothing happened. */
export async function POST(req: Request) {
  const actor = await currentAdmin();
  if (!actor) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "no_service_key" }, { status: 503 });
  }

  let body: { id?: number; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { id } = body;
  const status = body.status as SupportStatus | undefined;
  if (typeof id !== "number" || !status || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "update_failed" }, { status: 500 });

  await auditAdmin(actor, "ticket", null, { id, status });
  return NextResponse.json({ ok: true, id, status });
}
