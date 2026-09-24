import "server-only";
import { lookupCandidates, offToScanResult, OFF_FIELDS } from "./barcode";
import { CONTACT_EMAIL } from "./legal";
import type { ScanResultOut } from "./scan-result";

/* ===========================================================================
   Open Food Facts lookups, shared by the barcode route (to answer a scan) and
   the scan route (to decide whether a label read may be kept against a code).

   Not an SSRF surface: the host is fixed, and the only caller-controlled part
   of the URL is the code, which lookupCandidates() only ever builds from a
   validated 8-14 digit string.
   =========================================================================== */

/** Open Food Facts is a volunteer-run service; a slow answer must not hold a
    serverless function open for its full lifetime. */
const TIMEOUT_MS = 6000;

/* Open Food Facts asks every client to identify itself, and one fixed value
   means a misbehaving client cannot get the whole app's lookups blocked. */
const USER_AGENT = `RingBornn/1.0 (${CONTACT_EMAIL})`;

export type OffLookup =
  /** A product Open Food Facts knows, with a usable calorie figure. */
  | { status: "found"; code: string; result: ScanResultOut }
  /** Known to Open Food Facts, but with no calorie figure to use. */
  | { status: "no_kcal"; code: string }
  /** Unknown under every spelling of the code. */
  | { status: "unknown" }
  /** Open Food Facts could not be asked -- an outage, not an answer. */
  | { status: "error"; detail: string };

export async function lookupOff(code: string, locale: string): Promise<OffLookup> {
  for (const candidate of lookupCandidates(code)) {
    let body: unknown;
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${candidate}.json?fields=${OFF_FIELDS}`,
        {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: "no-store",
        },
      );
      /* An unknown product is an ordinary outcome: try the next spelling. */
      if (res.status === 404) continue;
      if (!res.ok) return { status: "error", detail: "status " + res.status };
      body = await res.json();
    } catch (err) {
      return { status: "error", detail: err instanceof Error ? err.message : String(err) };
    }
    if ((body as { status?: number })?.status !== 1) continue;
    const result = offToScanResult(body, locale);
    return result ? { status: "found", code: candidate, result } : { status: "no_kcal", code: candidate };
  }
  return { status: "unknown" };
}
