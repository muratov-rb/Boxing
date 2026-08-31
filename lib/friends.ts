/* Training partners: the shapes and the rules both sides agree on. */

export type FriendStatus = "pending" | "accepted" | "declined";
export type ChallengeKind = "exercise" | "spar" | "streak" | "custom";
export type ChallengeStatus = "sent" | "accepted" | "declined" | "done";

export const CHALLENGE_KINDS: ChallengeKind[] = ["exercise", "spar", "streak", "custom"];
export const CHALLENGE_MAX = 300;

/** How many partners one account may hold. High enough never to be felt by a
    real person, low enough that nobody farms thousands of links. */
export const MAX_FRIENDS = 100;

export interface Partner {
  /** The friendship row, not the user — what accept/remove act on. */
  id: number;
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  streak: number;
  xp: number;
  /** Set only on requests waiting on you; drives the accept/decline buttons. */
  incoming?: boolean;
  /** Absent on pending requests — there is no shared anything until they
      accept, and computing it would be answering a question nobody asked. */
  shared?: SharedStreak;
}

/** Who trained on the day the joint streak died. */
export type BrokeBy = "you" | "them" | "both";

export interface SharedStreak {
  /** Consecutive days you BOTH trained. */
  days: number;
  /** Today so far — the nudge, and the reason today is never blamed. */
  youToday: boolean;
  themToday: boolean;
  /** Only set when there is no streak left to lose. */
  brokeBy: BrokeBy | null;
}

export interface Challenge {
  id: number;
  kind: ChallengeKind;
  body: string;
  status: ChallengeStatus;
  createdAt: string;
  /** Whose challenge it is, from the reader's point of view. */
  mine: boolean;
  otherName: string | null;
}

/* ------------------------------- friend code ----------------------------- */

/* Crockford's base32 alphabet: I, L, O and U are absent.

   The point is that every excluded character has exactly one obvious
   intended reading -- O can only have meant 0, I and L can only have meant 1 --
   so a misread is repaired rather than silently accepted as a different valid
   code. An alphabet containing both members of a confusable pair (B and 8, say)
   cannot do that, which is the trap here: mapping a typo onto a real code that
   belongs to somebody else is worse than rejecting it.

   Six characters is ~1.07 billion combinations. */
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const CODE_LENGTH = 6;

export function generateFriendCode(random: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  }
  return out;
}

/** Accepts what a person actually types: spaces, dashes, lower case, and the
    four letters the alphabet leaves out. Returns null if it still isn't one. */
export function normaliseFriendCode(input: string): string | null {
  const cleaned = input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  if (cleaned.length !== CODE_LENGTH) return null;
  for (const ch of cleaned) if (!CODE_ALPHABET.includes(ch)) return null;
  return cleaned;
}

/* -------------------------------- streaks -------------------------------- */

/**
 * Consecutive training days ending today or yesterday.
 *
 * Yesterday counts as the anchor because a streak should not appear broken all
 * morning simply because today's session has not happened yet.
 *
 * `days` are ISO dates (YYYY-MM-DD) on which the person trained, any order.
 */
export function streakFrom(days: string[], today = new Date()): number {
  if (!days.length) return 0;
  const set = new Set(days);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const cursor = new Date(today);
  cursor.setUTCHours(0, 0, 0, 0);
  if (!set.has(iso(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!set.has(iso(cursor))) return 0;
  }

  let n = 0;
  while (set.has(iso(cursor))) {
    n++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return n;
}

/**
 * The streak the two of you hold together: days you BOTH trained.
 *
 * A streak you own alone is a number you can protect by yourself. A shared one
 * can be taken from you by somebody else, which is the entire point -- it is
 * the only number in the app that makes skipping a day cost someone besides
 * you.
 *
 * Today is never blamed on anyone. It is still going; a partner who trains in
 * the evening is not letting you down at nine in the morning, and telling you
 * they did would make the feature a liar twice a day. So `brokeBy` looks at
 * yesterday, and today is reported as plain fact through `youToday`/`themToday`.
 *
 * Both day lists are ISO dates (YYYY-MM-DD), any order.
 */
export function sharedStreakFrom(
  mine: string[],
  theirs: string[],
  today = new Date(),
): SharedStreak {
  const setA = new Set(mine);
  const setB = new Set(theirs);
  const both = mine.filter((d) => setB.has(d));

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const midnight = new Date(today);
  midnight.setUTCHours(0, 0, 0, 0);
  const todayIso = iso(midnight);

  const yesterday = new Date(midnight);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yIso = iso(yesterday);

  const days = streakFrom(both, today);
  const youToday = setA.has(todayIso);
  const themToday = setB.has(todayIso);

  /* A live streak has not been broken by anybody. */
  if (days > 0) return { days, youToday, themToday, brokeBy: null };

  /* With no streak left, yesterday is necessarily where it went: if you had
     both trained then, streakFrom would have anchored there and days > 0. So
     there is no search to do -- only the question of who was missing. */
  const youY = setA.has(yIso);
  const themY = setB.has(yIso);

  let brokeBy: BrokeBy | null = null;
  if (youY !== themY) {
    brokeBy = youY ? "them" : "you";
  } else if (!youY && !themY) {
    /* Neither trained. That is only a broken streak if there was one to
       break -- otherwise two people who linked this morning are told they
       have both already failed. */
    const hadOne = both.some((d) => d >= isoDaysAgo(midnight, BLAME_WINDOW_DAYS));
    brokeBy = hadOne ? "both" : null;
  }

  return { days, youToday, themToday, brokeBy };
}

/** How far back a shared day still counts as "you had a streak going". */
const BLAME_WINDOW_DAYS = 14;

function isoDaysAgo(from: Date, n: number): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}
