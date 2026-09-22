/* ===========================================================================
   Products learned from nutrition labels: the pure part.

   Pure so it can be tested without a database: what gets stored from a label
   read, when a new read may replace an old one, and how a stored product
   becomes the same result shape a scan produces. The database calls are in
   lib/products.ts.
   =========================================================================== */

import type { Per100g, ScanItemOut, ScanMicros, ScanResultOut } from "./scan-result";
import { macrosAt, totalsOf } from "./scan-result";

export interface ProductRecord {
  barcode: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  /** Milligrams per 100 g. */
  micros: Partial<ScanMicros>;
  confirmations: number;
}

const MICRO_KEYS: (keyof ScanMicros)[] = ["iron", "calcium", "potassium", "sodium", "vitaminC"];

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * What to store from a label read, or null when it should not be stored.
 *
 * Only a read of exactly one product, marked high confidence (every energy
 * and macro value legible), with a real calorie figure. Anything less is
 * still shown to the person who took the photo -- it is just not handed to
 * everyone else as fact.
 */
export function recordFromLabel(
  barcode: string,
  result: Pick<ScanResultOut, "items" | "micros">,
): Omit<ProductRecord, "confirmations"> | null {
  if (result.items.length !== 1) return null;
  const item = result.items[0];
  if (item.confidence !== "high" || !(item.per100g.kcal > 0) || !(item.grams > 0)) return null;
  const name = item.name.trim().slice(0, 80);
  if (!name) return null;

  /* The scan reports minerals for the portion; the store keeps them per
     100 g, like everything else, so any portion can be worked out later. */
  const micros: Partial<ScanMicros> = {};
  for (const k of MICRO_KEYS) {
    const v = result.micros[k];
    if (v > 0) micros[k] = round2((v * 100) / item.grams);
  }
  const p = item.per100g;
  return {
    barcode,
    name,
    grams: Math.round(item.grams),
    kcal: round2(p.kcal),
    protein: round2(p.protein),
    carbs: round2(p.carbs),
    fat: round2(p.fat),
    fiber: round2(p.fiber),
    micros,
  };
}

/** Two reads describe the same product when their energy is within 10%
    (or 5 kcal, for near-zero products like diet drinks). */
export function agrees(a: Pick<ProductRecord, "kcal">, b: Pick<ProductRecord, "kcal">): boolean {
  return Math.abs(a.kcal - b.kcal) <= Math.max(5, 0.1 * Math.max(a.kcal, b.kcal));
}

/**
 * What a new read does to an existing row:
 * - "confirm": it agrees, so the row gains a confirmation.
 * - "replace": it disagrees with a row nobody has confirmed, so the newer
 *   read wins -- the first photo may simply have been the bad one.
 * - "keep": it disagrees with a row two reads have agreed on, so this read is
 *   the likelier mistake and changes nothing.
 */
export function decide(
  existing: Pick<ProductRecord, "kcal" | "confirmations"> | null,
  incoming: Pick<ProductRecord, "kcal">,
): "insert" | "confirm" | "replace" | "keep" {
  if (!existing) return "insert";
  if (agrees(existing, incoming)) return "confirm";
  return existing.confirmations >= 2 ? "keep" : "replace";
}

/** A stored product as a scan result: one item at the stored portion. */
export function recordToScanResult(row: ProductRecord): ScanResultOut {
  const per100g: Per100g = {
    kcal: Number(row.kcal),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    fiber: Number(row.fiber),
  };
  const grams = row.grams;
  const item: ScanItemOut = {
    name: row.name,
    grams,
    per100g,
    confidence: "high",
    ...macrosAt(per100g, grams),
  };
  const factor = grams / 100;
  const mg = (k: keyof ScanMicros) => Math.round((Number(row.micros?.[k]) || 0) * factor);
  const totals = totalsOf([item]);
  return {
    items: [item],
    total_kcal: totals.kcal,
    total_protein: totals.protein,
    total_carbs: totals.carbs,
    total_fat: totals.fat,
    total_fiber: totals.fiber,
    micros: {
      iron: mg("iron"),
      calcium: mg("calcium"),
      potassium: mg("potassium"),
      sodium: mg("sodium"),
      vitaminC: mg("vitaminC"),
    },
    scale_reference: "",
    scale_found: true,
    note: "",
  };
}
