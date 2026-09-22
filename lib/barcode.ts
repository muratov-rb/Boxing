/* ===========================================================================
   Barcodes: validating them, and turning an Open Food Facts product into the
   same shape a meal scan produces.

   Same shape on purpose. The result screen, the weight controls, the
   ticking and the totals already exist and are tested; a packaged product is
   simply one item with an exact composition per 100 g, and everything
   downstream works unchanged.

   Pure: no fetch, no framework. Tested against real product records.

   Units, all of which were checked against live Open Food Facts data rather
   than assumed, because each one is an easy order-of-magnitude error:
   - `energy-kcal_100g` is kilocalories, but plain `energy_100g` is
     KILOJOULES (Coca-Cola: 42 kcal and 180 kJ). Used only as a fallback,
     divided by 4.184 -- mistaking one for the other is a 4.2x error.
   - Sodium and the minerals are in GRAMS per 100 g (Nutella: sodium 0.0428).
     This app stores milligrams.
   - Drinks are reported per 100 ml under the same `_100g` keys; ml is taken
     as grams, which is within a few percent for anything but syrup.
   =========================================================================== */

import type { ScanItemOut, ScanMicros, ScanResultOut } from "./scan-result";
import { macrosAt, totalsOf } from "./scan-result";

/** GTIN lengths: EAN-8 / UPC-E, UPC-A, EAN-13, GTIN-14. */
const LENGTHS = new Set([8, 12, 13, 14]);

/** Digits only, of a length a real product barcode has. Checked by character
    code rather than a regex -- no backslash in this file. */
export function isBarcodeFormat(code: unknown): code is string {
  if (typeof code !== "string" || !LENGTHS.has(code.length)) return false;
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    if (c < 48 || c > 57) return false;
  }
  return true;
}

/**
 * The GTIN check digit, for catching a mistyped number before looking it up.
 *
 * From the right, the digits before the check digit are weighted 3, 1, 3, 1...
 * An 8-digit code may be UPC-E, whose check digit is computed on its expanded
 * 12-digit form instead, so this is advisory for manual entry only: the camera
 * decoder verifies checksums itself, and the server checks format, not this.
 */
export function hasValidCheckDigit(code: string): boolean {
  if (!isBarcodeFormat(code)) return false;
  const digits = [...code].map((ch) => ch.charCodeAt(0) - 48);
  const check = digits.pop()!;
  let sum = 0;
  for (let i = digits.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) {
    sum += digits[i] * w;
  }
  return (10 - (sum % 10)) % 10 === check;
}

/* --------------------------- Open Food Facts --------------------------- */

export const OFF_FIELDS = [
  "product_name",
  "product_name_en",
  "product_name_ru",
  "product_name_es",
  "product_name_fr",
  "product_name_zh",
  "brands",
  "quantity",
  "serving_quantity",
  "product_quantity",
  "nutriments",
].join(",");

type Json = Record<string, unknown>;

function num(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : undefined;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Grams per 100 g, bounded like a scanned item so one bad field cannot
    produce a nonsense total. */
function clampPer100(value: number | undefined, max: number): number {
  if (value === undefined) return 0;
  /* Two decimals: a kJ-only label converts as 418.4 / 4.184 =
     99.99999999999999, which is correct arithmetic and a silly thing to store
     or send to a phone. */
  return Math.round(Math.min(max, value) * 100) / 100;
}

/**
 * The portion to start from.
 *
 * The serving size when the product states one (a 330 ml can: 330). Failing
 * that, the whole pack only when it is small enough to be one sitting -- a
 * 50 g bar is eaten whole, a 400 g jar of Nutella is not, and defaulting to
 * the jar would log 2,156 kcal for a spoonful. Otherwise 100 g, which the
 * person adjusts on the result screen.
 */
export function defaultGrams(product: Json): number {
  const serving = num(product.serving_quantity);
  if (serving && serving > 0 && serving <= 2000) return Math.round(serving);
  const pack = num(product.product_quantity);
  if (pack && pack > 0 && pack <= 100) return Math.round(pack);
  return 100;
}

/** The product's name in the reader's language when Open Food Facts has one,
    then the default name, then the brand. */
function productName(product: Json, locale: string): string {
  const localized = text(product["product_name_" + locale]);
  const name = localized || text(product.product_name) || text(product.product_name_en);
  const brand = text(product.brands).split(",")[0]?.trim() ?? "";
  if (name && brand && !name.toLowerCase().includes(brand.toLowerCase())) {
    return (name + " (" + brand + ")").slice(0, 80);
  }
  return (name || brand).slice(0, 80);
}

/**
 * An Open Food Facts API response to a scan result, or null when the product
 * is unknown or carries no usable calorie figure. A product with a name and no
 * nutrition is still null: showing "0 kcal" for it would be worse than sending
 * the person to photograph the label.
 */
export function offToScanResult(response: unknown, locale: string): ScanResultOut | null {
  const body = (response ?? {}) as Json;
  if (body.status !== 1 || typeof body.product !== "object" || body.product === null) {
    return null;
  }
  const product = body.product as Json;
  const n = (product.nutriments ?? {}) as Json;

  const kcalDirect = num(n["energy-kcal_100g"]);
  const kj = num(n["energy-kj_100g"]) ?? num(n["energy_100g"]);
  const kcal = kcalDirect ?? (kj !== undefined ? kj / 4.184 : undefined);
  if (kcal === undefined) return null;

  const name = productName(product, locale);
  if (!name) return null;

  const per100g = {
    kcal: clampPer100(kcal, 900),
    protein: clampPer100(num(n.proteins_100g), 100),
    carbs: clampPer100(num(n.carbohydrates_100g), 100),
    fat: clampPer100(num(n.fat_100g), 100),
    fiber: clampPer100(num(n.fiber_100g), 60),
  };
  const grams = defaultGrams(product);

  const item: ScanItemOut = {
    name,
    grams,
    per100g,
    /* Printed on the pack, not estimated from a photo. */
    confidence: "high",
    ...macrosAt(per100g, grams),
  };

  /* Grams per 100 g -> milligrams for the portion. Sodium falls back to salt
     (salt is 2.5x sodium by weight) because many labels only print salt. */
  const factor = grams / 100;
  const sodiumG = num(n.sodium_100g) ?? (num(n.salt_100g) !== undefined ? num(n.salt_100g)! / 2.5 : 0);
  const mg = (g: number | undefined) => Math.round((g ?? 0) * 1000 * factor);
  const micros: ScanMicros = {
    iron: mg(num(n.iron_100g)),
    calcium: mg(num(n.calcium_100g)),
    potassium: mg(num(n.potassium_100g)),
    sodium: mg(sodiumG),
    vitaminC: mg(num(n["vitamin-c_100g"])),
  };

  const totals = totalsOf([item]);
  return {
    items: [item],
    total_kcal: totals.kcal,
    total_protein: totals.protein,
    total_carbs: totals.carbs,
    total_fat: totals.fat,
    total_fiber: totals.fiber,
    micros,
    scale_reference: "",
    scale_found: true,
    note: "",
  };
}
