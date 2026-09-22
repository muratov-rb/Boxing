import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { guardAiRoute, isDenied, quotaDenied } from "@/lib/api-guard";
import { checkRate, recordAttempt } from "@/lib/rate-limit";
import { isBarcodeFormat, offToScanResult, OFF_FIELDS } from "@/lib/barcode";
import { CONTACT_EMAIL } from "@/lib/legal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===========================================================================
   Barcode -> nutrition, from Open Food Facts.

   For packaged food a barcode beats any photo: the label is exact and the
   lookup costs no AI, so it does NOT spend a daily scan. It is still behind
   the same gate as the scanner (signed in, not banned, a plan that has the
   calorie counter), because it is part of that feature.

   Server-side rather than from the browser, for three reasons: the browser's
   IP address is not handed to a third party with every snack; the CSP needs
   no new connect-src; and one place controls the User-Agent Open Food Facts
   asks every client to send, so a misbehaving client cannot get the whole
   app's lookups blocked.

   Not an SSRF like the push endpoints were: the host is fixed, and the only
   part of the URL a caller controls is the code, which must be 8-14 digits.

   Coverage is the known weakness. Open Food Facts had ~1,650 products tagged
   for Uzbekistan in September 2026, against ~974,000 for the US. International
   brands are found anyway -- a barcode is the same everywhere -- but many local
   products are not, which is why a miss sends the person to photograph the
   nutrition label instead of to a dead end.
   =========================================================================== */

/** Lookups per user per 15-minute window. Generous -- someone scanning their
    cupboard does a dozen in a row -- and still a ceiling, so one account
    cannot use this server to hammer Open Food Facts and get every user's
    lookups throttled. */
const LOOKUPS_PER_WINDOW = 60;

/** Open Food Facts is a volunteer-run service; a slow answer must not hold a
    serverless function open for its full lifetime. */
const TIMEOUT_MS = 6000;

const USER_AGENT = `RingBornn/1.0 (${CONTACT_EMAIL})`;

export async function GET(req: Request) {
  const guard = await guardAiRoute(null);
  if (isDenied(guard)) return guard.response;
  if (guard.entitlements.calorieScansPerDay <= 0) {
    return quotaDenied(guard, { allowed: false, used: 0, limit: 0, locked: true });
  }

  const code = new URL(req.url).searchParams.get("code") ?? "";
  if (!isBarcodeFormat(code)) {
    return NextResponse.json({ error: "bad_barcode" }, { status: 400 });
  }

  const rateKey = "barcode:" + guard.userId;
  const verdict = await checkRate(rateKey);
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: "too_many_lookups", retryAfter: verdict.retryAfter },
      { status: 429, headers: { "retry-after": String(verdict.retryAfter) } },
    );
  }
  await recordAttempt(rateKey, LOOKUPS_PER_WINDOW);

  let body: unknown;
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      },
    );
    /* An unknown product is an ordinary outcome, not an outage. */
    if (res.status === 404) return NextResponse.json({ found: false });
    if (!res.ok) {
      console.error("food-barcode: open food facts answered", res.status);
      return NextResponse.json({ error: "lookup_unavailable" }, { status: 502 });
    }
    body = await res.json();
  } catch (err) {
    console.error("food-barcode: lookup failed:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "lookup_unavailable" }, { status: 502 });
  }

  const store = await cookies();
  const locale = store.get("locale")?.value ?? "en";
  const result = offToScanResult(body, locale);

  /* Known product without a calorie figure counts as not found: a result of
     "0 kcal" would be worse than sending the person to read the label. */
  if (!result) return NextResponse.json({ found: false });
  return NextResponse.json({ found: true, source: "barcode", ...result });
}
