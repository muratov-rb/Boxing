/* ===========================================================================
   RINGBORNN — the details the legal pages depend on.

   Everything a human has to decide lives here rather than buried in the page
   copy. Change it once and both /privacy and /terms follow.
   =========================================================================== */

/** Bump this whenever the wording of either page changes materially. */
export const LEGAL_UPDATED = "5 August 2026";

/** Who operates the service, as it should appear to a user. */
export const OPERATOR = "Nexara";
export const SERVICE = "RingBornn";
export const SITE = "ringbornn.com";

/** Absolute origin, for the places that need a real URL rather than a label —
    the sitemap, robots.txt and the link previews shared on social. Derived
    from SITE so buying a domain means changing one line, not hunting for
    hard-coded addresses. */
export const SITE_URL = `https://${SITE}`;

/* Blank until a real inbox exists — an address printed in a privacy policy
   that nobody reads is worse than none, because access and deletion requests
   sent there vanish silently.

   The support form at /support is the channel that always works: it writes to
   our own database and surfaces in the admin panel, so nothing depends on an
   inbox being watched. Fill this in anyway once a mailbox exists — some people
   will only ever write an email, and the payment provider's approval checklist
   asks for a contact address. */
export const CONTACT_EMAIL = "ringbornn.help@gmail.com";

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

/* The form leads because it is the only route with a delivery guarantee — it
   writes to our database rather than to somebody's inbox, and every request
   filed through it appears in the admin panel with a reference number. */
export function contactLine(): Record<"en"|"ru"|"es"|"fr"|"zh", string> {
  const mail = CONTACT_EMAIL ? `, ${CONTACT_EMAIL}` : "";
  return {
    en: `Use the support form at ${SITE}/support${mail ? `, email ${CONTACT_EMAIL}` : ""}, or message us on Telegram at t.me/ringbornn.`,
    ru: `Напиши через форму поддержки на ${SITE}/support${mail ? `, на почту ${CONTACT_EMAIL}` : ""} или в Telegram: t.me/ringbornn.`,
    es: `Usa el formulario de soporte en ${SITE}/support${mail ? `, escribe a ${CONTACT_EMAIL}` : ""} o escríbenos por Telegram en t.me/ringbornn.`,
    fr: `Utilisez le formulaire d’assistance sur ${SITE}/support${mail ? `, écrivez à ${CONTACT_EMAIL}` : ""} ou contactez-nous sur Telegram : t.me/ringbornn.`,
    zh: `请使用 ${SITE}/support 的支持表单${mail ? `，或发邮件至 ${CONTACT_EMAIL}` : ""}，也可以在 Telegram 上联系我们：t.me/ringbornn。`,
  };
}
