/* ===========================================================================
   RINGBORNN — the details the legal pages depend on.

   Everything a human has to decide lives here rather than buried in the page
   copy. Change it once and both /privacy and /terms follow.
   =========================================================================== */

/** Bump this whenever the wording of either page changes materially. */
export const LEGAL_UPDATED = "4 August 2026";

/** Who operates the service, as it should appear to a user. */
export const OPERATOR = "Nexara";
export const SERVICE = "RingBornn";
export const SITE = "boxing-murex.vercel.app";

/** Where access and deletion requests land, and the address Paddle's review
    looks for. A dedicated inbox rather than a personal one, so it can be
    handed over or shared without giving away anything else. */
export const CONTACT_EMAIL = "ringbornn@gmail.com";

/** Deadline we commit to for access/deletion requests. 30 days is the GDPR
    limit and the figure most services quote, so it travels well. */
export const REQUEST_DAYS = 30;

/** Who legally sells the subscription. Paddle is the merchant of record, not
    just a processor: it is the seller on the invoice, it charges the card, and
    it remits the sales tax. Users see this name on their statement, so the
    pages have to say it out loud. */
export const MERCHANT = "Paddle";

export const CONTACT_TELEGRAM = "https://t.me/ringbornn";

/* TODO(owner): the country whose law governs the terms and whose courts hear
   disputes — normally where you (or the company) are established. */
export const GOVERNING_LAW = "Uzbekistan";

/** Where the database physically lives (Supabase project region). */
export const DATA_REGION = "Singapore (ap-southeast-1)";

/** Minimum age to hold an account. Keep in step with statIssues() in
    lib/onboarding.ts — today that validator accepts ages from 8. */
export const MIN_AGE = 16;

export function contactLine(): string {
  return CONTACT_EMAIL
    ? `Email ${CONTACT_EMAIL}, or message us on Telegram at t.me/ringbornn.`
    : "Message us on Telegram at t.me/ringbornn.";
}
