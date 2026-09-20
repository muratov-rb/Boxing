import { NextResponse } from "next/server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/user";
import { pushConfigured, sendPush, type PushPayload } from "@/lib/push-server";
import { pushCopy } from "@/lib/push-copy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Send yourself a reminder right now, through the real path.

   This exists because the first live test looked like a total failure and was
   not one. A reminder had been set for 20:51 with a meal logged at 20:17, and
   the dispatcher correctly skipped it — a meal nudge is suppressed when you
   have just eaten. Nothing arrived, nothing was wrong, and there was no way
   to tell those two apart from the phone.

   The in-app Test button could not settle it either: it rang the local bell,
   which proves nothing about whether a push can reach the device. This goes
   the whole way — server, VAPID signature, push service, phone — so a silent
   result means something really is broken.

   It deliberately ignores the schedule and does NOT touch last_fired, so
   testing can never consume a real reminder or suppress one later today. */

/** Generous enough to be useful, low enough to be pointless as a way of
    making our server send traffic somewhere on request. */
const MAX_DEVICES = 12;

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!serviceRoleConfigured() || !pushConfigured()) {
    return NextResponse.json({ error: "push_unavailable" }, { status: 503 });
  }

  const db = createAdminClient();
  /* Scoped to the caller's own devices. There is no endpoint parameter on
     purpose: an endpoint taken from the request would make this a way to make
     our server, holding our VAPID key, post to an address of someone else's
     choosing. */
  const { data, error } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, locale")
    .eq("user_id", user.id)
    .limit(MAX_DEVICES);

  if (error) return NextResponse.json({ error: "read_failed" }, { status: 500 });

  const rows = (data ?? []) as {
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    locale: string;
  }[];
  if (rows.length === 0) {
    /* Not an error: it means this browser never registered, which is itself
       the answer the person is looking for. */
    return NextResponse.json({ ok: true, devices: 0, sent: 0 });
  }

  let sent = 0;
  let removed = 0;

  for (const row of rows) {
    const words = pushCopy(row.locale);
    const payload: PushPayload = {
      title: words.testPushTitle ?? "RingBornn",
      body: words.testPushBody ?? "",
      /* A fresh tag every time, so two tests in a row are visibly two
         notifications rather than one silently replacing the other. */
      tag: "test:" + Date.now(),
      url: "/calories",
      kind: "meal",
      at: "",
      label: "",
    };

    const result = await sendPush(row, payload);
    if (result === "sent") sent++;
    if (result === "gone") {
      /* The browser threw this subscription away without telling us — which
         is exactly the failure this button exists to surface. */
      await db.from("push_subscriptions").delete().eq("id", row.id);
      removed++;
    }
  }

  return NextResponse.json({ ok: true, devices: rows.length, sent, removed });
}
