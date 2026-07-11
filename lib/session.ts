/* ===========================================================================
   RINGBORNN — daily session builder + weekly rest scheduling.
   Turns the bodyweight catalog into a structured, genuinely useful week:
   five training days (focus rotates), one active-recovery day and one full
   rest day, so the fighter builds strength instead of burning out.
   Deterministic per calendar day — "today's workout" is stable through the
   day and changes tomorrow.
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

/** train = full session · active = light recovery flow · rest = day off */
export type DayKind = "train" | "active" | "rest";

export interface DailyPlan {
  kind: DayKind;
  focus: FocusId;
  items: Exercise[];
  level: 1 | 2 | 3;
}

interface DaySpec {
  kind: DayKind;
  focus: FocusId;
}

/* the weekly split (index 0 = Sunday … 6 = Saturday) */
const WEEK: DaySpec[] = [
  { kind: "rest", focus: "fullbody" }, // Sun — full rest
  { kind: "train", focus: "push" }, // Mon
  { kind: "train", focus: "legs" }, // Tue
  { kind: "train", focus: "skill" }, // Wed
  { kind: "active", focus: "core" }, // Thu — active recovery
  { kind: "train", focus: "power" }, // Fri
  { kind: "train", focus: "core" }, // Sat
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

/* gentle movements that make up an active-recovery flow */
const RECOVERY_IDS = [
  "arm-circles",
  "shadow-footwork",
  "birddog",
  "good-morning",
  "dead-bug",
  "superman",
  "calf-raises",
  "glute-bridge",
];

const dayIndex = (d: Date) => ((d.getDay() % 7) + 7) % 7;

export function daySpec(date = new Date()): DaySpec {
  return WEEK[dayIndex(date)];
}

export function dayKind(date = new Date()): DayKind {
  return WEEK[dayIndex(date)].kind;
}

/** The next date that is a training day (used when someone opts to train on a
    scheduled rest day anyway). */
export function nextTrainingDate(from = new Date()): Date {
  const d = new Date(from);
  for (let i = 0; i < 8; i++) {
    if (daySpec(d).kind === "train") return d;
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/** The 7-day plan for the schedule strip on the dashboard. */
export function weekSchedule(): { kind: DayKind; focus: FocusId }[] {
  return WEEK.map((d) => ({ kind: d.kind, focus: d.focus }));
}

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
 * Build today's plan from the (already equipment-filtered) exercise pool.
 * Rest days return an empty list; active-recovery days return a short, light
 * flow; training days return the full structured session for the day's focus.
 */
export function buildDailyPlan(
  all: Exercise[],
  profile: Profile | null,
  date = new Date(),
): DailyPlan {
  const level = levelOf(profile);
  const spec = daySpec(date);
  const seed = daysSinceEpoch(date);

  if (spec.kind === "rest") {
    return { kind: "rest", focus: spec.focus, items: [], level };
  }

  if (spec.kind === "active") {
    // a light, low-intensity flow: mobility, easy core, footwork — level 1 only
    const recovery = RECOVERY_IDS.map((id) => all.find((e) => e.id === id)).filter(
      (e): e is Exercise => !!e && e.level === 1,
    );
    const items = rotate(recovery, seed, 5);
    return { kind: "active", focus: spec.focus, items, level };
  }

  const maxLevel = level >= 2 ? 3 : 2; // experienced fighters unlock advanced work
  const pool = all.filter((e) => e.level <= maxLevel);
  const focus = spec.focus;

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

  return { kind: "train", focus, items: picked, level };
}
