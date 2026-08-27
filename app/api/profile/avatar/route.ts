import { NextResponse } from "next/server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Profile pictures.

   The upload goes through here rather than straight from the browser to
   Supabase Storage. Everything else in this app reaches the database through a
   route holding the service-role key, and doing the same for storage means the
   bucket needs no policies of its own -- the session check below is the only
   gate, and it is the same gate as everywhere else.

   One file per user, always at the same key, so an upload replaces the last
   picture instead of leaving the old one behind to be paid for forever. */

const BUCKET = "avatars";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB, matching the bucket's own limit

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const ext = EXT[file.type];
  if (!ext) return NextResponse.json({ error: "bad_type" }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const admin = createAdminClient();
  const path = `${user.id}/avatar.${ext}`;

  /* Someone who switches from a PNG to a JPEG would otherwise keep the old
     file at the old extension, still public and still billed. */
  const stale = Object.values(EXT)
    .filter((e) => e !== ext)
    .map((e) => `${user.id}/avatar.${e}`);
  await admin.storage.from(BUCKET).remove(stale);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });
  if (upErr) {
    console.error("[avatar_upload]", upErr);
    /* The bucket is created once, by hand, outside this code. Say so plainly
       rather than reporting a generic failure nobody can act on. */
    const missing = /bucket/i.test(upErr.message ?? "");
    return NextResponse.json(
      { error: missing ? "no_bucket" : "upload_failed" },
      { status: missing ? 503 : 500 },
    );
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path);

  /* Cache-busted: the path never changes, so without this the browser keeps
     showing the previous picture after a replacement. */
  const url = `${publicUrl}?v=${Date.now()}`;

  const { error: rowErr } = await admin
    .from("user_profiles")
    .upsert(
      { user_id: user.id, avatar_url: url, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (rowErr) {
    console.error("[avatar_row]", rowErr);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, avatarUrl: url });
}

export async function DELETE() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!serviceRoleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const admin = createAdminClient();
  await admin.storage
    .from(BUCKET)
    .remove(Object.values(EXT).map((e) => `${user.id}/avatar.${e}`));

  const { error } = await admin
    .from("user_profiles")
    .upsert(
      { user_id: user.id, avatar_url: null, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) {
    console.error("[avatar_delete]", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
