import type { Profile } from "./onboarding";

/* ===========================================================================
   Micronutrients, fibre and water.

   WHAT IS DELIBERATELY NOT HERE: a full vitamin panel. Estimating vitamin D or
   B12 from a photograph of a plate is not something current models do well,
   and a confident-looking "47% of your B12" that is invented is worse than no
   number at all — it is the same failure as a fallback engine posing as AI.

   The five tracked here were chosen because they are the ones a fighter's diet
   actually goes wrong on, and because they can be estimated from a described
   portion with reasonable honesty. Everything derived here is still an
   estimate and the UI says so.
   =========================================================================== */

export const MICRO_KEYS = ["iron", "calcium", "potassium", "sodium", "vitaminC"] as const;
export type MicroKey = (typeof MICRO_KEYS)[number];

export type Micros = Partial<Record<MicroKey, number>>;

export interface MicroSpec {
  key: MicroKey;
  unit: "mg";
  /** A target is something to reach; a limit is something to stay under.
      Sodium is the only limit, and showing it as a goal would coach people
      into eating more salt — the opposite of the advice. */
  kind: "target" | "limit";
  male: number;
  female: number;
}

/* Adult reference intakes. Iron and potassium differ enough by sex to be worth
   splitting; where a figure is shared, both columns carry it. */
export const MICRO_SPECS: Record<MicroKey, MicroSpec> = {
  iron: { key: "iron", unit: "mg", kind: "target", male: 8, female: 18 },
  calcium: { key: "calcium", unit: "mg", kind: "target", male: 1000, female: 1000 },
  potassium: { key: "potassium", unit: "mg", kind: "target", male: 3400, female: 2600 },
  sodium: { key: "sodium", unit: "mg", kind: "limit", male: 2300, female: 2300 },
  vitaminC: { key: "vitaminC", unit: "mg", kind: "target", male: 90, female: 75 },
};

/** Unspecified sex takes the higher of the two, so a target is never set too
    low to matter and a limit is never set too high to warn. */
function forSex(spec: MicroSpec, sex: Profile["sex"] | undefined): number {
  if (sex === "male") return spec.male;
  if (sex === "female") return spec.female;
  return spec.kind === "limit"
    ? Math.min(spec.male, spec.female)
    : Math.max(spec.male, spec.female);
}

export function microTargets(p: Profile | null): Record<MicroKey, number> {
  const out = {} as Record<MicroKey, number>;
  for (const key of MICRO_KEYS) out[key] = forSex(MICRO_SPECS[key], p?.sex);
  return out;
}

/* --------------------------------- fibre --------------------------------- */

/* Scaled to energy intake (14 g per 1000 kcal) rather than a flat number: a
   1,400 kcal cut and a 3,200 kcal bulk should not carry the same goal. */
export function fiberTarget(kcal: number): number {
  return Math.max(20, Math.round((kcal / 1000) * 14));
}

/* --------------------------------- water --------------------------------- */

export const WATER_MIN_ML = 1500;
export const WATER_MAX_ML = 5000;
/** One tap on the glass button. 250 ml is a normal drinking glass. */
export const GLASS_ML = 250;

/** Roughly 35 ml per kg, plus a training allowance on days you actually train.
    Bounded at both ends: the low end because nobody should be coached under
    1.5 L, the high end because over-drinking is its own hazard. */
export function waterTarget(p: Profile | null, trainedToday = false): number {
  const raw = p?.weightUnit === "lb" ? Number(p?.weight) * 0.4536 : Number(p?.weight);
  const kg = raw > 0 && raw < 350 ? raw : 75;
  const base = kg * 35 + (trainedToday ? 500 : 0);
  const rounded = Math.round(base / 100) * 100;
  return Math.min(WATER_MAX_ML, Math.max(WATER_MIN_ML, rounded));
}

/** "1.8 L" reads better than "1800 ml" once you are past a litre. */
export function formatWater(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)} L` : `${ml} ml`;
}

/* -------------------------------- summing -------------------------------- */

/** Add up whatever the day's meals happen to carry. Absent values count as
    zero rather than breaking the total — most manually typed meals will only
    ever have calories, and a missing figure is not a zero-milligram meal. */
export function sumMicros(list: { micros?: Micros }[]): Micros {
  const out: Micros = {};
  for (const item of list) {
    if (!item.micros) continue;
    for (const key of MICRO_KEYS) {
      const v = item.micros[key];
      if (typeof v === "number" && v > 0) out[key] = (out[key] ?? 0) + v;
    }
  }
  return out;
}

/** How much of the day's meals carried micronutrient data at all. The bars are
    meaningless if two of five meals were typed in by hand, so the UI shows
    this rather than implying a complete picture. */
export function microCoverage(list: { micros?: Micros }[]): number {
  if (list.length === 0) return 0;
  const withData = list.filter((m) => m.micros && Object.keys(m.micros).length > 0).length;
  return Math.round((withData / list.length) * 100);
}
