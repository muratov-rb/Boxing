/* ===========================================================================
   RINGBORNN — user data sync.

   Tracking state lives in localStorage for instant reads; this layer mirrors it
   to Supabase so progress follows the account instead of the browser.

   Pulling MERGES rather than overwrites. Training days, visits and meals are
   things that happened — if you log a workout on your phone and then open the
   laptop (whose copy is older), the workout must survive. Cumulative counters
   take whichever side is further along.
   =========================================================================== */

import { createClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import { KEYS, hydrateLocal, readSlice, onTrackingChange, type Meal } from "./tracking";
import type { Profile } from "./onboarding";

interface XpState {
  xp: number;
  lastActive: string;
  day?: string;
  dayXp?: number;
}
type MealMap = Record<string, Meal[]>;
type UsageMap = Record<string, Record<string, number>>;
type BurnMap = Record<string, number>;

interface ActivityRow {
  day: string;
  trained: boolean;
  visited: boolean;
  burned: number;
  meals: Meal[];
  usage: Record<string, number>;
}

const uniqSorted = (a: string[], b: string[]) =>
  [...new Set([...a, ...b])].filter(Boolean).sort();

/** Union two days' meals by id — the same meal logged twice must not double. */
function mergeMeals(a: Meal[], b: Meal[]): Meal[] {
  const byId = new Map<string, Meal>();
  for (const m of [...a, ...b]) if (m?.id) byId.set(m.id, m);
  return [...byId.values()].sort((x, y) => (x.at < y.at ? -1 : 1));
}

/* ------------------------------ pull + merge ----------------------------- */

export interface ServerState {
  profile: Profile | null;
  progress: {
    xp: number;
    xp_last_active: string | null;
    xp_day: string | null;
    xp_day_amount: number;
    rank_seen: number;
  } | null;
  activity: ActivityRow[];
}

/**
 * Work out what local state should become, given what the server holds.
 * Pure with respect to the network (reads local storage, returns a patch), so
 * the merge rules can be exercised directly — this is the code that would
 * silently lose a workout if it were wrong.
 */
export function computeMergePatch(server: ServerState): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  // profile: only adopt the server's if we have none locally
  const localProfile = readSlice<Profile | null>(KEYS.profile, null);
  if (!localProfile && server.profile) patch[KEYS.profile] = server.profile;

  // progress: keep whichever side is further along
  const localXp = readSlice<XpState>(KEYS.xp, { xp: 0, lastActive: "" });
  const srv = server.progress;
  if (srv) {
    const serverXp: XpState = {
      xp: srv.xp ?? 0,
      lastActive: srv.xp_last_active ?? localXp.lastActive,
      day: srv.xp_day ?? localXp.day,
      dayXp: srv.xp_day_amount ?? localXp.dayXp,
    };
    if (serverXp.xp > (localXp.xp ?? 0)) patch[KEYS.xp] = serverXp;
    const localSeen = readSlice<number>(KEYS.rankSeen, 0);
    if ((srv.rank_seen ?? 0) > localSeen) patch[KEYS.rankSeen] = srv.rank_seen;
  }

  // per-day activity: union with local
  const rows = server.activity ?? [];
  if (rows.length) {
    const srvTrained = rows.filter((r) => r.trained).map((r) => r.day);
    const srvVisited = rows.filter((r) => r.visited).map((r) => r.day);
    patch[KEYS.streak] = uniqSorted(readSlice<string[]>(KEYS.streak, []), srvTrained);
    patch[KEYS.visits] = uniqSorted(readSlice<string[]>(KEYS.visits, []), srvVisited);

    const meals = { ...readSlice<MealMap>(KEYS.meals, {}) };
    const burn = { ...readSlice<BurnMap>(KEYS.burn, {}) };
    const usage = { ...readSlice<UsageMap>(KEYS.usage, {}) };
    for (const r of rows) {
      meals[r.day] = mergeMeals(meals[r.day] ?? [], (r.meals ?? []) as Meal[]);
      burn[r.day] = Math.max(burn[r.day] ?? 0, r.burned ?? 0);
      const localDay = usage[r.day] ?? {};
      const srvDay = r.usage ?? {};
      const merged: Record<string, number> = { ...localDay };
      for (const [k, v] of Object.entries(srvDay)) {
        merged[k] = Math.max(merged[k] ?? 0, Number(v) || 0);
      }
      usage[r.day] = merged;
    }
    patch[KEYS.meals] = meals;
    patch[KEYS.burn] = burn;
    patch[KEYS.usage] = usage;
  }

  return patch;
}

export async function pullUserData(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return false;

  const [profileRes, progressRes, activityRes] = await Promise.all([
    supabase.from("user_profiles").select("profile").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("user_progress")
      .select("xp, xp_last_active, xp_day, xp_day_amount, rank_seen")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_activity")
      .select("day, trained, visited, burned, meals, usage")
      .eq("user_id", user.id),
  ]);

  const patch = computeMergePatch({
    profile: (profileRes.data?.profile ?? null) as Profile | null,
    progress: progressRes.data ?? null,
    activity: (activityRes.data ?? []) as ActivityRow[],
  });

  if (Object.keys(patch).length) hydrateLocal(patch);
  return true;
}

/* --------------------------------- push ---------------------------------- */

async function pushProfile(userId: string) {
  const profile = readSlice<Profile | null>(KEYS.profile, null);
  if (!profile) return;
  await createClient()
    .from("user_profiles")
    .upsert({ user_id: userId, profile, updated_at: new Date().toISOString() });
}

/* XP itself is never pushed. The server owns it — /api/progress/award decides
   what an action is worth and writes the total — so uploading the browser's
   copy would just hand the number back to the client. The database refuses
   these columns to signed-in users anyway; this keeps the request honest.

   rank_seen is the exception: it only records which rank-up celebration the
   user has already watched, so it is theirs to set. */
async function pushProgress(userId: string) {
  await createClient()
    .from("user_progress")
    .upsert({
      user_id: userId,
      rank_seen: readSlice<number>(KEYS.rankSeen, 0),
      updated_at: new Date().toISOString(),
    });
}

/** Push only the days that actually carry something — usually just today. */
async function pushActivity(userId: string, days: string[]) {
  if (!days.length) return;
  const trained = new Set(readSlice<string[]>(KEYS.streak, []));
  const visited = new Set(readSlice<string[]>(KEYS.visits, []));
  const meals = readSlice<MealMap>(KEYS.meals, {});
  const burn = readSlice<BurnMap>(KEYS.burn, {});
  /* `usage` is deliberately absent: it is the quota the paid features are
     metered against, so it is written only by consume_usage on the server.
     Pushing the local copy would let anyone reset their own limits. */
  const rows = days.map((day) => ({
    user_id: userId,
    day,
    trained: trained.has(day),
    visited: visited.has(day),
    burned: burn[day] ?? 0,
    meals: meals[day] ?? [],
    updated_at: new Date().toISOString(),
  }));
  await createClient().from("user_activity").upsert(rows);
}

/* ------------------------------ change plumbing --------------------------- */

const ACTIVITY_KEYS: string[] = [KEYS.streak, KEYS.visits, KEYS.meals, KEYS.burn, KEYS.usage];

/** Days we hold local data for, newest first and bounded — a long-standing
    account must not re-upload years of history on every load. */
const MAX_DAYS_PER_PUSH = 90;

function allLocalDays(): string[] {
  const days = new Set<string>([
    ...readSlice<string[]>(KEYS.streak, []),
    ...readSlice<string[]>(KEYS.visits, []),
    ...Object.keys(readSlice<MealMap>(KEYS.meals, {})),
    ...Object.keys(readSlice<BurnMap>(KEYS.burn, {})),
    ...Object.keys(readSlice<UsageMap>(KEYS.usage, {})),
  ]);
  return [...days]
    .filter(Boolean)
    .sort()
    .reverse()
    .slice(0, MAX_DAYS_PER_PUSH);
}

/**
 * Start mirroring local changes to Supabase. Returns a stop function.
 * Writes are debounced and coalesced, so a burst of updates costs one round
 * trip rather than one per keystroke.
 */
export function startSync(): () => void {
  if (!isSupabaseConfigured()) return () => {};
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const dirty = new Set<string>();

  const flush = async () => {
    timer = null;
    if (stopped || !dirty.size) return;
    const keys = [...dirty];
    dirty.clear();
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;
      const jobs: Promise<unknown>[] = [];
      if (keys.includes(KEYS.profile)) jobs.push(pushProfile(user.id));
      if (keys.includes(KEYS.xp) || keys.includes(KEYS.rankSeen)) {
        jobs.push(pushProgress(user.id));
      }
      if (keys.some((k) => ACTIVITY_KEYS.includes(k))) {
        jobs.push(pushActivity(user.id, allLocalDays()));
      }
      await Promise.all(jobs);
    } catch {
      /* offline or blocked — local state is untouched, we retry on next change */
    }
  };

  const unsubscribe = onTrackingChange((key) => {
    dirty.add(key);
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 1200);
  });

  return () => {
    stopped = true;
    unsubscribe();
    if (timer) clearTimeout(timer);
  };
}

/** One-shot upload of everything held locally (used right after a pull). */
export async function pushAll(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;
    await Promise.all([
      pushProfile(user.id),
      pushProgress(user.id),
      pushActivity(user.id, allLocalDays()),
    ]);
  } catch {
    /* best effort */
  }
}
