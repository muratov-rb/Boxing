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
