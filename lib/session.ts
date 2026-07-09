/* ===========================================================================
   RINGBORNN — daily session builder.
   Turns the bodyweight catalog into a structured, genuinely useful workout:
   warm-up → boxing skill → strength (focus rotates by weekday) → conditioning
   finisher → core. Deterministic per calendar day, so "today's workout" is
   stable through the day and changes tomorrow.
   =========================================================================== */

import type { Exercise, BodyPart } from "./exercises";
import type { Profile } from "./onboarding";

export type FocusId =
  | "fullbody"
  | "push"
  | "legs"
  | "skill"
  | "pull"
  | "power"
  | "core";

export interface DailyPlan {
  focus: FocusId;
  items: Exercise[];
  level: 1 | 2 | 3;
}

/* which muscle groups each weekday leans into */
const WEEK_FOCUS: FocusId[] = [
  "fullbody", // Sun
  "push", // Mon
  "legs", // Tue
  "skill", // Wed
  "pull", // Thu
  "power", // Fri
  "core", // Sat
];

const FOCUS_PARTS: Record<FocusId, BodyPart[]> = {
  fullbody: ["fullbody", "legs", "core"],
  push: ["chest", "arms", "shoulders"],
  legs: ["legs"],
  skill: ["technique"],
  pull: ["back", "core"],
  power: ["fullbody", "legs"],
  core: ["core"],
};

export function daysSinceEpoch(d = new Date()): number {
  return Math.floor(
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000,
  );
}

/* deterministic rotating pick — same day → same choice, next day → shifts */
function rotate<T>(pool: T[], seed: number, count: number): T[] {
  if (pool.length === 0) return [];
  const out: T[] = [];
  for (let i = 0; i < count && i < pool.length; i++) {
    out.push(pool[(seed + i) % pool.length]);
  }
  return out;
}

function levelOf(profile: Profile | null): 1 | 2 | 3 {
  if (!profile) return 1;
  if (profile.path === "experienced") return 2;
  return 1;
}

/**
 * Build today's session from the (already equipment-filtered) exercise pool.
 * The structure is fixed and useful; the specific exercises rotate daily and
 * respect the fighter's level (beginners never get level-3 movements).
 */
export function buildDailyPlan(
  all: Exercise[],
  profile: Profile | null,
  date = new Date(),
): DailyPlan {
  const level = levelOf(profile);
  const maxLevel = level >= 2 ? 3 : 2; // experienced fighters unlock advanced work
  const pool = all.filter((e) => e.level <= maxLevel);
  const seed = daysSinceEpoch(date);
  const focus = WEEK_FOCUS[((date.getDay() % 7) + 7) % 7];

  const picked: Exercise[] = [];
  const seen = new Set<string>();
  const add = (list: Exercise[]) => {
    for (const e of list) {
      if (picked.length >= 8) break;
      if (!seen.has(e.id)) {
        seen.add(e.id);
        picked.push(e);
      }
    }
  };
  const byParts = (parts: BodyPart[]) =>
    pool.filter((e) => parts.includes(e.bodyPart) && !seen.has(e.id));

  // 1) warm-up — a light full-body mover to raise the heart rate
  const warm = pool.filter(
    (e) => e.bodyPart === "fullbody" && e.level === 1 && !seen.has(e.id),
  );
  add(rotate(warm, seed, 1));

  // 2) boxing skill block — always two rounds of technique
  add(rotate(byParts(["technique"]), seed, focus === "skill" ? 3 : 2));

  // 3) strength — the day's focus muscles carry the main work
  add(rotate(byParts(FOCUS_PARTS[focus]), seed + 1, focus === "skill" ? 1 : 2));

  // 4) a complementary strength movement from a different area
  add(rotate(byParts(["chest", "back", "legs", "shoulders", "arms"]), seed + 3, 1));

  // 5) conditioning finisher
  add(rotate(byParts(["fullbody"]), seed + 5, 1));

  // 6) core to close
  add(rotate(byParts(["core"]), seed + 2, 1));

  // top up to a full session if the pool was thin
  if (picked.length < 5) add(rotate(pool, seed + 7, 5 - picked.length));

  return { focus, items: picked, level };
}
