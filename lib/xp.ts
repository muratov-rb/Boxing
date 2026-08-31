/* ===========================================================================
   RINGBORNN — the XP economy, in one place.

   These numbers decide what a rank is worth, so they are the server's to
   apply, not the browser's. They live here (no localStorage, no server-only)
   because both sides need to agree on them: the API awards with them, and the
   client uses the same ladder to render a progress bar without a round trip.

   The client may *display* anything it likes from these. It may not decide
   what it earned — /api/progress/award does that.
   =========================================================================== */

/* XP per action. Kept small: a rank should take months, not an evening.

   There used to be a third entry, `visit: 2`, for opening the app once a day.
   It was wrong twice over. A rank is meant to say what someone has done in
   the gym, and paying it out for launching the app said only that they had a
   phone -- someone who trained nothing for a month still climbed.

   It was also the one award the server never saw: it was written straight to
   localStorage instead of going through /api/progress/award, so the browser's
   total drifted permanently above the real one (the sync keeps whichever side
   is higher, and XP is never pushed up). The rank bar on the dashboard and
   the rank on the profile were reading two different numbers. */
export const XP_AWARDS = {
  lesson: 6, // marking a lesson done
  workout: 15, // finishing a guided session
} as const;

export type XpKind = keyof typeof XP_AWARDS;

/** Most you can earn in one day, so a marathon session can't skip a rank. */
export const DAILY_XP_CAP = 25;

/** XP lost per idle day past the grace window — ranks can slip, not only rise. */
export const XP_DECAY_PER_DAY = 12;

/** One day off costs nothing. */
export const XP_GRACE_DAYS = 1;

/** Cumulative XP needed for each rank, Novice → Immortal. */
export const RANK_XP = [
  0, 150, 400, 850, 1600, 2800, 4600, 7200, 11000, 16500, 24000,
];

export function rankFromXp(xp: number): number {
  let idx = 0;
  for (let i = 0; i < RANK_XP.length; i++) if (xp >= RANK_XP[i]) idx = i;
  return idx;
}

/* --------------------------- starting position ---------------------------- */

/** Rank index a path opens at. Someone who already boxes should not be told
    they are a Novice — but they still have to earn the top of the ladder, so
    this is a modest head start, not a shortcut. */
export const STARTING_RANK: Record<"beginner" | "experienced", number> = {
  beginner: 0,
  experienced: 2,
};

/** The XP that head start is worth. Granted once, server-side, and never
    lowers a total the user has already passed. */
export function startingXp(path: "beginner" | "experienced"): number {
  return RANK_XP[STARTING_RANK[path]] ?? 0;
}
