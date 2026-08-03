import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/* What has been done inside the panel. Loaded on demand rather than with the
   page: it names the accounts that were changed or wiped, so there is no
   reason to ship it to anyone who merely opened the dashboard. */
export async function GET() {
  if (!(await currentAdmin())) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "no_service_key" }, { status: 503 });
  }

  const { data, error } = await createAdminClient()
    .from("admin_audit")
    .select("actor, action, target_user, detail, at")
    .order("at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });
  return NextResponse.json({ activity: data ?? [] });
}
