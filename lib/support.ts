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
