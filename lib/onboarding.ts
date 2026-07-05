/* ===========================================================================
   PRESSURE — onboarding domain model (v2)
   Rich, AI-ready profile: multi-goal, custom goals, flexible timeframe,
   training environment + equipment inventory, and nutrition access tier.
   Still client-only to build; the Profile shape is the seam where Supabase
   persistence and the Claude analysis route plug in.
   =========================================================================== */

export type PathId = "beginner" | "experienced";

export type GoalId =
  | "lose_fat"
  | "get_fit"
  | "build"
  | "technique"
  | "endurance"
  | "strength"
  | "compete"
  | "confidence"
  | "self_defense";

export type TimeframeId = "6w" | "3m" | "6m" | "custom";

export type EnvId = "gym" | "home_equipped" | "home_bodyweight";

export type EquipmentId =
  | "heavybag"
  | "speedbag"
  | "jumprope"
  | "gloves"
  | "dumbbells"
  | "barbell"
  | "bench"
  | "pullupbar"
  | "kettlebell"
  | "bands"
  | "oddobjects"
  | "mirror";

export type NutritionAccessId = "full" | "moderate" | "tight" | "minimal";

export type Sex = "male" | "female" | "other" | "";
export type WeightUnit = "kg" | "lb";
export type HeightUnit = "cm" | "ft";

export interface Profile {
  path: PathId | null;

  /* stats */
  weight: string;
  weightUnit: WeightUnit;
  height: string;
  heightUnit: HeightUnit;
  age: string;
  sex: Sex;

  /* goals — multi-select plus free-text */
  goals: GoalId[];
  customGoal: string;
  targetWeight: string; // relevant when "lose_fat" is chosen

  /* timeframe — presets or custom deadline */
  timeframe: TimeframeId | null;
  customTimeframe: string;

  /* training environment + equipment inventory */
  environment: EnvId | null;
  equipment: EquipmentId[];
  equipmentNotes: string;

  /* nutrition access / budget */
  nutritionAccess: NutritionAccessId | null;
  supplements: boolean;
  dietNotes: string;
}

export const initialProfile: Profile = {
  path: null,
  weight: "",
  weightUnit: "kg",
  height: "",
  heightUnit: "cm",
  age: "",
  sex: "",
  goals: [],
  customGoal: "",
  targetWeight: "",
  timeframe: null,
  customTimeframe: "",
  environment: null,
  equipment: [],
  equipmentNotes: "",
  nutritionAccess: null,
  supplements: false,
  dietNotes: "",
};

/* --------------------------------------------------------------------------
   reducer — generic patch keeps the flow easy to extend
   -------------------------------------------------------------------------- */
export type ProfileAction =
  | { type: "patch"; patch: Partial<Profile> }
  | { type: "reset" };

export function profileReducer(state: Profile, action: ProfileAction): Profile {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.patch };
    case "reset":
      return initialProfile;
    default:
      return state;
  }
}

/* helper: toggle a value in an array field (for multi-selects) */
export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

/* --------------------------------------------------------------------------
   paths — the two audiences
   -------------------------------------------------------------------------- */
export interface PathOption {
  id: PathId;
  label: string;
  tagline: string;
  blurb: string;
  points: string[];
}

export const PATHS: PathOption[] = [
  {
    id: "beginner",
    label: "I'm a Beginner",
    tagline: "New to the ring",
    blurb:
      "Never thrown a real punch? Perfect. We start at zero — stance, guard and footwork — and build you into shape one round at a time.",
    points: [
      "Learn the fundamentals from scratch",
      "Get lean and athletic",
      "No experience or gear needed",
    ],
  },
  {
    id: "experienced",
    label: "I Have Experience / Pro",
    tagline: "Already throw hands",
    blurb:
      "Got a background? We'll skip the basics and push your combinations, conditioning and ring IQ with structured, skill-building work.",
    points: [
      "Advanced combinations & drills",
      "Sharpen technique and timing",
      "Structured, periodized training",
    ],
  },
];

/* --------------------------------------------------------------------------
   goals — multi-select
   -------------------------------------------------------------------------- */
export interface GoalOption {
  id: GoalId;
  label: string;
  hint: string;
}

export const GOALS: GoalOption[] = [
  { id: "lose_fat", label: "Cut Weight", hint: "Burn fat, get lean" },
  { id: "get_fit", label: "Get Fit", hint: "Overall conditioning" },
  { id: "build", label: "Build Power", hint: "Strength & muscle" },
  { id: "technique", label: "Sharpen Technique", hint: "Cleaner, faster hands" },
  { id: "endurance", label: "Boxing Cardio", hint: "Lungs & stamina" },
  { id: "strength", label: "Raw Strength", hint: "Hit harder" },
  { id: "compete", label: "Fight Ready", hint: "Train to compete" },
  { id: "confidence", label: "Confidence", hint: "Discipline & mindset" },
  { id: "self_defense", label: "Self-Defense", hint: "Protect yourself" },
];

export function goalNeedsTargetWeight(goals: GoalId[]): boolean {
  return goals.includes("lose_fat") || goals.includes("build");
}

/* --------------------------------------------------------------------------
   timeframes
   -------------------------------------------------------------------------- */
export interface TimeframeOption {
  id: TimeframeId;
  label: string;
  sub: string;
  weeks: number; // used by the analysis engine
}

export const TIMEFRAMES: TimeframeOption[] = [
  { id: "6w", label: "6 Weeks", sub: "Quick shred", weeks: 6 },
  { id: "3m", label: "3 Months", sub: "Real change", weeks: 13 },
  { id: "6m", label: "6 Months", sub: "Full transformation", weeks: 26 },
  { id: "custom", label: "Custom", sub: "Set your own deadline", weeks: 13 },
];

/* --------------------------------------------------------------------------
   training environment + equipment
   -------------------------------------------------------------------------- */
export interface EnvOption {
  id: EnvId;
  label: string;
  hint: string;
}

export const ENVIRONMENTS: EnvOption[] = [
  { id: "gym", label: "Full Gym", hint: "Bags, weights, the works" },
  { id: "home_equipped", label: "Home + Kit", hint: "Some equipment at home" },
  {
    id: "home_bodyweight",
    label: "Bodyweight Only",
    hint: "No equipment — just me",
  },
];

export interface EquipmentOption {
  id: EquipmentId;
  label: string;
}

export const EQUIPMENT: EquipmentOption[] = [
  { id: "heavybag", label: "Heavy Bag" },
  { id: "speedbag", label: "Speed Bag" },
  { id: "jumprope", label: "Jump Rope" },
  { id: "gloves", label: "Gloves & Wraps" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "barbell", label: "Barbell" },
  { id: "bench", label: "Bench" },
  { id: "pullupbar", label: "Pull-up Bar" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "bands", label: "Resistance Bands" },
  { id: "oddobjects", label: "Sandbag / Stones" },
  { id: "mirror", label: "Mirror" },
];

/* --------------------------------------------------------------------------
   nutrition access / budget
   -------------------------------------------------------------------------- */
export interface NutritionAccessOption {
  id: NutritionAccessId;
  label: string;
  hint: string;
}

export const NUTRITION_ACCESS: NutritionAccessOption[] = [
  {
    id: "full",
    label: "No Limits",
    hint: "Protein, quality food & supplements — no problem",
  },
  {
    id: "moderate",
    label: "Comfortable",
    hint: "Decent groceries, the odd supplement",
  },
  { id: "tight", label: "Budget", hint: "Basics only, no supplements" },
  {
    id: "minimal",
    label: "Bare Minimum",
    hint: "Whatever's cheap and available",
  },
];

/* --------------------------------------------------------------------------
   ranks / belts — the full ladder, novice → legend
   -------------------------------------------------------------------------- */
export interface RankTier {
  name: string;
  title: string;
  blurb: string;
}

export const RANKS: RankTier[] = [
  { name: "Novice", title: "First Round", blurb: "Everyone starts here. Gloves on." },
  { name: "Amateur", title: "The Basics", blurb: "Stance, guard and footwork locked in." },
  { name: "Prospect", title: "Rising", blurb: "Combinations flowing, engine building." },
  { name: "Contender", title: "Dangerous", blurb: "You can hold your own in the ring." },
  { name: "Good Fighter", title: "Sharp", blurb: "Clean technique, real conditioning." },
  { name: "Sweet Fighter", title: "Slick", blurb: "Slips, rolls and counters — hard to hit." },
  { name: "Great Fighter", title: "Elite", blurb: "A complete boxer. Power meets ring IQ." },
  { name: "Professional", title: "The Pro", blurb: "You belong under the lights." },
  { name: "Champion", title: "The Belt", blurb: "Best in the room — every room." },
  { name: "Legend", title: "The Greatest", blurb: "Float like a butterfly, sting like a bee." },
  { name: "Immortal", title: "Iron", blurb: "The baddest on the planet. Untouchable." },
];

export const STARTING_RANK_INDEX = 0;
export const STARTING_RANK = RANKS[STARTING_RANK_INDEX].name;

/* --------------------------------------------------------------------------
   display helpers
   -------------------------------------------------------------------------- */
export function goalLabels(profile: Profile): string[] {
  const labels = profile.goals
    .map((id) => GOALS.find((g) => g.id === id)?.label)
    .filter(Boolean) as string[];
  const custom = profile.customGoal.trim();
  if (custom) labels.push(custom);
  return labels;
}

export function timeframeText(profile: Profile): string {
  if (profile.timeframe === "custom") return profile.customTimeframe.trim();
  return TIMEFRAMES.find((t) => t.id === profile.timeframe)?.label ?? "";
}

export function timeframeWeeks(profile: Profile): number {
  if (profile.timeframe === "custom") {
    const m = profile.customTimeframe.match(/(\d+)\s*(week|wk|month|mo|day)/i);
    if (m) {
      const n = Number(m[1]);
      const unit = m[2].toLowerCase();
      if (unit.startsWith("day")) return Math.max(1, Math.round(n / 7));
      if (unit.startsWith("mo")) return n * 4;
      return n; // weeks
    }
    return 13; // sensible default
  }
  return TIMEFRAMES.find((t) => t.id === profile.timeframe)?.weeks ?? 13;
}

export function environmentLabel(id: EnvId | null): string {
  return ENVIRONMENTS.find((e) => e.id === id)?.label ?? "";
}

export function equipmentLabels(profile: Profile): string[] {
  return profile.equipment
    .map((id) => EQUIPMENT.find((e) => e.id === id)?.label)
    .filter(Boolean) as string[];
}

export function nutritionAccessLabel(id: NutritionAccessId | null): string {
  return NUTRITION_ACCESS.find((n) => n.id === id)?.label ?? "";
}

/* has any punching/bag capability? drives bag vs shadow work in the plan */
export function hasBag(profile: Profile): boolean {
  return (
    profile.environment === "gym" ||
    profile.equipment.includes("heavybag") ||
    profile.equipment.includes("speedbag")
  );
}

export function hasWeights(profile: Profile): boolean {
  if (profile.environment === "gym") return true;
  return ["dumbbells", "barbell", "kettlebell", "bench"].some((e) =>
    profile.equipment.includes(e as EquipmentId),
  );
}
