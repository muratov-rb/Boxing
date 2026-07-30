import { NextResponse } from "next/server";
import { currentAdmin, auditAdmin, hashPassword, adminUser } from "@/lib/admin-auth";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { MIN_PASSWORD_LENGTH, passwordLongEnough } from "@/lib/auth-rules";

export const runtime = "nodejs";

/* Managing who else can get into the panel. Owner only — support staff must
   not be able to promote themselves or add an accomplice. */

async function requireOwner() {
  const actor = await currentAdmin();
  if (!actor) return { error: NextResponse.json({ error: "unauthorised" }, { status: 401 }) };
  if (actor.role !== "owner") {
    return { error: NextResponse.json({ error: "owner_only" }, { status: 403 }) };
  }
  if (!serviceRoleConfigured()) {
    return { error: NextResponse.json({ error: "no_service_key" }, { status: 503 }) };
  }
  return { actor };
}

export async function GET() {
  const gate = await requireOwner();
  if (gate.error) return gate.error;

  const db = createAdminClient();
  const [staff, audit] = await Promise.all([
    db
      .from("admin_users")
      .select("username, role, created_at, created_by, last_login")
      .order("created_at", { ascending: true }),
    db
      .from("admin_audit")
      .select("actor, role, action, target_user, detail, at")
      .order("at", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({
    owner: adminUser(),
    staff: staff.data ?? [],
    audit: audit.data ?? [],
  });
}

export async function POST(req: Request) {
  const gate = await requireOwner();
  if (gate.error) return gate.error;

  let body: { username?: string; password?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const username = (body.username ?? "").trim().toLowerCase();
  const role = body.role === "owner" ? "owner" : "support";
  const password = body.password ?? "";

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return NextResponse.json({ error: "bad_username" }, { status: 400 });
  }
  /* The env owner name is reserved: a row shadowing it would be checked second
     and never win, which would look like a silently broken account. */
  if (username === adminUser().toLowerCase()) {
    return NextResponse.json({ error: "name_reserved" }, { status: 400 });
  }
  if (!passwordLongEnough(password)) {
    return NextResponse.json(
      { error: "weak_password", min: MIN_PASSWORD_LENGTH },
      { status: 400 },
    );
  }

  const { salt, hash } = hashPassword(password);
  const { error } = await createAdminClient().from("admin_users").insert({
    username,
    password_hash: hash,
    salt,
    role,
    created_by: gate.actor.username,
  });

  if (error) {
    const taken = error.code === "23505";
    return NextResponse.json(
      { error: taken ? "name_taken" : "create_failed" },
      { status: taken ? 409 : 500 },
    );
  }

  await auditAdmin(gate.actor, "createAdmin", null, { username, role });
  return NextResponse.json({ ok: true, username, role });
}

export async function DELETE(req: Request) {
  const gate = await requireOwner();
  if (gate.error) return gate.error;

  const username = new URL(req.url).searchParams.get("username")?.trim().toLowerCase();
  if (!username) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { error } = await createAdminClient()
    .from("admin_users")
    .delete()
    .eq("username", username);
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });

  await auditAdmin(gate.actor, "removeAdmin", null, { username });
  return NextResponse.json({ ok: true });
}
