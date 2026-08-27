/* Shared shape of a support request.

   Lives outside the API route because the form, the route and the admin panel
   all have to agree on the same list of topics and the same length limits —
   when they drift, the browser accepts a message the database then rejects. */

export const SUPPORT_TOPICS = ["bug", "billing", "account", "data", "other"] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 4000;
export const EMAIL_MAX = 200;

/** How many requests one source may file per hour before being asked to wait.
    Generous for a person with a real problem, cheap enough that a script
    cannot fill the table. */
export const MAX_PER_HOUR = 5;

export type SupportStatus = "new" | "open" | "done";

export function isTopic(value: unknown): value is SupportTopic {
  return typeof value === "string" && (SUPPORT_TOPICS as readonly string[]).includes(value);
}

/* Deliberately loose. A stricter pattern rejects valid addresses far more often
   than it catches typos, and the real check is whether our reply arrives. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/* ------------------------------- replies -------------------------------- */

export type ReplyAuthor = "user" | "admin";

export const REPLY_MIN = 1;
export const REPLY_MAX = 4000;

export interface SupportReply {
  id: number;
  author: ReplyAuthor;
  body: string;
  created_at: string;
}

/** One request and everything said about it since, oldest first. */
export interface SupportThread {
  id: number;
  topic: SupportTopic;
  message: string;
  status: SupportStatus;
  created_at: string;
  last_reply_at: string | null;
  user_seen_at: string | null;
  replies: SupportReply[];
}

/** True when the owner has answered since the user last opened the thread. */
export function hasUnread(t: Pick<SupportThread, "last_reply_at" | "user_seen_at">): boolean {
  if (!t.last_reply_at) return false;
  if (!t.user_seen_at) return true;
  return Date.parse(t.last_reply_at) > Date.parse(t.user_seen_at);
}

/* ---------------------------- throwaway mail ----------------------------- */

/* Addresses that stop existing in ten minutes. Someone using one cannot be
   reached about their own account, cannot be sent a password reset, and cannot
   be refunded without a support thread they will never read.

   A blocklist is not a real defence -- there are thousands of these domains and
   new ones daily -- so this is not trying to be complete. It catches the common
   ones at the moment of signup, where the cost of being wrong is a person
   retyping an address. Email confirmation is what actually proves the address
   works; this only stops the obvious cases earlier and more kindly. */
const THROWAWAY_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "sharklasers.com",
  "10minutemail.com", "10minutemail.net", "tempmail.com", "temp-mail.org",
  "throwawaymail.com", "yopmail.com", "yopmail.fr", "trashmail.com",
  "getnada.com", "nada.email", "dispostable.com", "maildrop.cc",
  "fakeinbox.com", "mailnesia.com", "mytemp.email", "moakt.com",
  "tempr.email", "spamgourmet.com", "mohmal.com", "emailondeck.com",
  "burnermail.io", "temp-mail.io", "minuteinbox.com", "inboxkitten.com",
]);

/** True for an address whose domain is a known disposable-mail service. */
export function isThrowawayEmail(value: string): boolean {
  const at = value.lastIndexOf("@");
  if (at < 0) return false;
  return THROWAWAY_DOMAINS.has(value.slice(at + 1).trim().toLowerCase());
}

/* ------------------------------ display name ----------------------------- */

export const NAME_MIN = 1;
export const NAME_MAX = 40;

/** Collapses whitespace and trims to the column's limit. Returns null for a
    name that is empty once cleaned, which the database stores as "not set". */
export function cleanDisplayName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
  return s.length >= NAME_MIN ? s : null;
}
