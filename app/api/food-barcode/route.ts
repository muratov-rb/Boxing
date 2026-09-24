import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { guardAiRoute, isDenied, quotaDenied } from "@/lib/api-guard";
import { checkRate, recordAttempt } from "@/lib/rate-limit";
import { isBarcodeFormat, lookupCandidates } from "@/lib/barcode";
import { lookupOff } from "@/lib/off";
import { findProduct } from "@/lib/products";
import { recordToScanResult } from "@/lib/product-record";

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

  /* One line per lookup, so a report of "the barcode didn't work" can be
     matched to what actually happened. A barcode is a product number, not
     anything about the person. */
  const log = (outcome: string) =>
    console.log("food-barcode " + JSON.stringify({ code, outcome }));

  const store = await cookies();
  const locale = store.get("locale")?.value ?? "en";

  /* Open Food Facts FIRST, always. Products learned from labels are written
     by users, so they must never outrank the real database: checked first,
     one person photographing a fake label against Coca-Cola's barcode would
     have changed Coca-Cola for everyone (found in the 2026-09-24 audit). */
  const off = await lookupOff(code, locale);
  if (off.status === "found") {
    const item = off.result.items[0];
    log("off:" + off.code + " " + item?.per100g.kcal + "kcal/100g " + item?.grams + "g");
    return NextResponse.json({ found: true, source: "barcode", origin: "off", ...off.result });
  }

  /* Unknown to Open Food Facts, or known with no calorie figure: a label
     someone read here is the next best thing. Also during an outage -- a
     learned product is only ever stored for a code Open Food Facts did not
     know at the time (see /api/food-scan), so serving it cannot shadow one. */
  const learned = await findProduct(lookupCandidates(code));
  if (learned) {
    log("learned:" + learned.barcode + (off.status === "error" ? " (off down)" : ""));
    return NextResponse.json({
      found: true,
      source: "barcode",
      origin: "learned",
      ...recordToScanResult(learned),
    });
  }

  if (off.status === "error") {
    console.error("food-barcode: open food facts unavailable:", off.detail);
    log("off_error");
    return NextResponse.json({ error: "lookup_unavailable" }, { status: 502 });
  }

  /* Known product without a calorie figure counts as not found: a result of
     "0 kcal" would be worse than sending the person to read the label. */
  log(off.status === "no_kcal" ? "off_no_kcal:" + off.code : "not_found");
  return NextResponse.json({ found: false });
}
