import "server-only";
import webpush from "web-push";
import { isPushServiceEndpoint } from "./push-endpoints";

/* ===========================================================================
   Sending a web push.

   VAPID is how a push service knows the message is from us: the private key
   signs a token, the public key is what the browser subscribed with, and the
   two have to be the same pair forever. Rotating them silently invalidates
   every subscription already out there — every device would have to re-grant
   permission, and nothing would report an error, so the reminders would just
   stop. If they ever must be rotated, the subscriptions table has to be
   emptied in the same breath.
   =========================================================================== */

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** What the service worker receives. Kept small — a push payload is encrypted
    and size-limited, and anything the notification does not need is weight. */
export interface PushPayload {
  title: string;
  body: string;
  tag: string;
  url: string;
  /** So an open page can ring the bell and draw the in-app card too. */
  kind: "meal" | "training" | "water";
  at: string;
  label: string;
}

export type SendResult = "sent" | "gone" | "failed";

function publicKey(): string {
  return process.env.VAPID_PUBLIC_KEY?.trim() ?? "";
}

function privateKey(): string {
  return process.env.VAPID_PRIVATE_KEY?.trim() ?? "";
}

/** mailto: or https: — the push services reject anything else, and some of
    them reject a missing subject outright rather than ignoring it. */
function subject(): string {
  const value = process.env.VAPID_SUBJECT?.trim();
  return value && /^(mailto:|https:)/.test(value) ? value : "mailto:support@ringbornn.com";
}

export function pushConfigured(): boolean {
  return publicKey().length > 0 && privateKey().length > 0;
}

let ready = false;
function configure(): void {
  if (ready) return;
  webpush.setVapidDetails(subject(), publicKey(), privateKey());
  ready = true;
}

/**
 * Deliver one notification.
 *
 * Distinguishes "this device is gone" from "this did not work". A push
 * service answers 404 or 410 when the subscription is dead — the app was
 * uninstalled, the browser data cleared, permission revoked — and the correct
 * response is to delete the row, not to retry it every minute until the end
 * of time. Everything else is a transient failure worth counting.
 */
export async function sendPush(target: PushTarget, payload: PushPayload): Promise<SendResult> {
  if (!pushConfigured()) return "failed";
  /* The one place a push leaves this server, so the one place the destination
     is checked: the dispatcher, the Test button and anything added later are
     all covered without having to remember to be. An address that is not a
     browser push service is not a device -- it is someone using this server
     to send requests somewhere (proven live, 2026-09-22). Reported as "gone"
     so every caller deletes the row rather than retrying it every minute. */
  if (!isPushServiceEndpoint(target.endpoint)) return "gone";
  configure();

  try {
    await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload),
      {
        /* Long enough to survive a phone that is asleep or briefly offline,
           short enough that a reminder cannot arrive hours late and confuse
           someone about what it is for. */
        TTL: 900,
        urgency: "high",
      },
    );
    return "sent";
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone";
    return "failed";
  }
}
