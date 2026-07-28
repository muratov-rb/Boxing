/* ===========================================================================
   RINGBORNN — the details the legal pages depend on.

   Everything a human has to decide lives here rather than buried in the page
   copy. Change it once and both /privacy and /terms follow.
   =========================================================================== */

/** Bump this whenever the wording of either page changes materially. */
export const LEGAL_UPDATED = "28 July 2026";

/** Who operates the service, as it should appear to a user. */
export const OPERATOR = "Nexara";
export const SERVICE = "RingBornn";
export const SITE = "boxing-murex.vercel.app";

/* TODO(owner): put a real inbox here before you take payments or sign up
   users outside your own circle. A privacy policy with no way to reach a
   human is not worth much — deletion and access requests have to land
   somewhere. Left blank deliberately: publishing a personal address is your
   call, not mine. While it is blank the pages point people at Telegram. */
export const CONTACT_EMAIL = "";

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
