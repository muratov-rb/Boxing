/* ===========================================================================
   Turning a meal-scan answer into numbers — the arithmetic the model is no
   longer trusted with.

   The model reports, per food, a weight in grams and a composition per 100 g.
   Everything a person actually sees — calories, protein, carbs, fat, fibre,
   the totals — is computed here from those. Two consequences, both of them
   the point:

   - Calories are strictly proportional to the portion. The same dish at
     twice the weight is exactly twice the calories, which the old "give me a
     kcal figure" approach could not promise and did not deliver.
   - Totals are the sum of the items. The model used to produce both, and was
     free to make them disagree.

   For a plain food the composition need not be an estimate at all: where the
   model names a reference entry and its own figure agrees with it, the
   laboratory-measured values are used instead (see agrees, below). The
   weight is still the model's - no table can know how much is on the plate.

   Shared by the route (which builds the answer) and the scanner UI (which
   rescales it when someone corrects a weight), so the two cannot compute the
   same number two different ways.
   =========================================================================== */

export type Confidence = "high" | "medium" | "low";

export interface Per100g {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface ScanItemOut {
  name: string;
  grams: number;
  per100g: Per100g;
  confidence: Confidence;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  /** Present when the model named a reference food for this item. */
  reference?: {
    key: string;
    /** true: per100g is the measured reference composition. false: the
        model's own estimate disagreed with it and the match was not
        believed, so per100g is still the estimate. */
    used: boolean;
    /** The model's own kcal per 100 g, kept so the two can be compared in
        the logs. */
    ownKcal: number;
  };
}

/** Measured composition for a reference food, or undefined if there is no
    such entry. Passed in by the route so the table itself stays out of this
    file, which the browser also loads. */
export type FoodLookup = (key: string) => Per100g | undefined;

export interface ScanMicros {
  iron: number;
  calcium: number;
  potassium: number;
  sodium: number;
  vitaminC: number;
}

export interface ScanResultOut {
  items: ScanItemOut[];
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  micros: ScanMicros;
  scale_reference: string;
  /** Whether the portion was measured against something, or assumed. */
  scale_found: boolean;
  note: string;
}

/** Heaviest single visible item accepted, and the lightest. */
export const MAX_GRAMS = 2500;
export const MIN_GRAMS = 1;

function clamp(value: unknown, lo: number, hi: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

/** Macros for a given weight of a food, from its composition per 100 g. */
export function macrosAt(per100g: Per100g, grams: number) {
  const factor = grams / 100;
  return {
    kcal: Math.round(per100g.kcal * factor),
    protein: Math.round(per100g.protein * factor),
    carbs: Math.round(per100g.carbs * factor),
    fat: Math.round(per100g.fat * factor),
    fiber: Math.round(per100g.fiber * factor),
  };
}

/* Whether a reference value and the model's own estimate describe the same
   food. The model names a reference entry AND gives its own composition for
   what it sees; the entry is only trusted when the two land close together.

   That is what catches the wrong match. A breaded, fried cutlet matched to
   plain roast chicken breast (165 kcal) arrives with the model's own figure
   near 260, and a reference value swapped in there would not be more
   accurate - it would be a precise number for a different food. Within a
   quarter either way the two agree on what the food is, and the measured
   value is the better of the two. The 20 kcal floor is for vegetables, where
   a quarter of 18 kcal is smaller than ordinary rounding. */
export function agrees(ownKcal: number, referenceKcal: number): boolean {
  return Math.abs(ownKcal - referenceKcal) <= Math.max(20, referenceKcal * 0.25);
}

interface RawItem {
  name?: unknown;
  grams?: unknown;
  per_100g?: Record<string, unknown>;
  food_key?: unknown;
  confidence?: unknown;
}

/* The bounds structured outputs cannot state (it rejects minimum/maximum).
   They are physical limits, not tuning: nothing edible exceeds pure fat's
   ~900 kcal per 100 g, no macro exceeds 100 g per 100 g, and no single
   visible item on a plate weighs 2.5 kg. A value outside them is a malformed
   answer, and clamping it is what stops one bad field turning into a
   40,000 kcal lunch in somebody's daily total. */
export function toItem(raw: RawItem, lookup?: FoodLookup): ScanItemOut {
  const grams = Math.round(clamp(raw.grams, MIN_GRAMS, MAX_GRAMS));
  const p = raw.per_100g ?? {};
  const own: Per100g = {
    kcal: clamp(p.kcal, 0, 900),
    protein: clamp(p.protein, 0, 100),
    carbs: clamp(p.carbs, 0, 100),
    fat: clamp(p.fat, 0, 100),
    fiber: clamp(p.fiber, 0, 60),
  };
  /* The key is free text from the model, so it is normalised and then looked
     up, never used to index anything directly. Anything that is not an entry
     - "none", a misspelling, a food it made up - simply finds nothing. */
  const key =
    typeof raw.food_key === "string" ? raw.food_key.trim().toLowerCase().replace(/[ -]+/g, "_") : "";
  const fact = key && lookup ? lookup(key) : undefined;
  const used = fact !== undefined && agrees(own.kcal, fact.kcal);
  /* Copied field by field: the table's rows carry more than a composition,
     and none of the rest belongs in a response. */
  const per100g: Per100g =
    fact && used
      ? { kcal: fact.kcal, protein: fact.protein, carbs: fact.carbs, fat: fact.fat, fiber: fact.fiber }
      : own;
  const confidence: Confidence =
    raw.confidence === "high" || raw.confidence === "low" ? raw.confidence : "medium";
  return {
    name: String(raw.name ?? "").trim().slice(0, 80),
    grams,
    per100g,
    confidence,
    ...macrosAt(per100g, grams),
    ...(fact ? { reference: { key, used, ownKcal: Math.round(own.kcal) } } : {}),
  };
}

/** Micros for the whole meal, clamped to what one meal could plausibly hold. */
export function toMicros(raw: unknown): ScanMicros {
  const m = (raw ?? {}) as Record<string, unknown>;
  return {
    iron: Math.round(clamp(m.iron, 0, 100)),
    calcium: Math.round(clamp(m.calcium, 0, 5000)),
    potassium: Math.round(clamp(m.potassium, 0, 10000)),
    sodium: Math.round(clamp(m.sodium, 0, 10000)),
    vitaminC: Math.round(clamp(m.vitaminC, 0, 2000)),
  };
}

/** Sum a list of items. The only place a total is ever produced. */
export function totalsOf(items: Pick<ScanItemOut, "kcal" | "protein" | "carbs" | "fat" | "fiber">[]) {
  const sum = (key: "kcal" | "protein" | "carbs" | "fat" | "fiber") =>
    items.reduce((n, item) => n + item[key], 0);
  return {
    kcal: sum("kcal"),
    protein: sum("protein"),
    carbs: sum("carbs"),
    fat: sum("fat"),
    fiber: sum("fiber"),
  };
}

/** The response the scanner route sends back, built from the model's answer. */
export function buildScanResult(
  parsed: {
    scale_reference?: unknown;
    scale_found?: unknown;
    items?: unknown;
    micros?: unknown;
    note?: unknown;
  },
  lookup?: FoodLookup,
): ScanResultOut {
  const items = (Array.isArray(parsed.items) ? parsed.items : [])
    .map((raw) => toItem(raw as RawItem, lookup))
    .filter((item) => item.name.length > 0);
  const totals = totalsOf(items);

  return {
    items,
    total_kcal: totals.kcal,
    total_protein: totals.protein,
    total_carbs: totals.carbs,
    total_fat: totals.fat,
    total_fiber: totals.fiber,
    micros: toMicros(parsed.micros),
    scale_reference: String(parsed.scale_reference ?? "").trim().slice(0, 80),
    /* Strictly true: an answer that omits the flag has not shown it measured
       anything, and the UI warns in that case rather than implying it did. */
    scale_found: parsed.scale_found === true,
    note: String(parsed.note ?? "").trim().slice(0, 400),
  };
}
