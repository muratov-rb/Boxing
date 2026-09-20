/* ===========================================================================
   RINGBORNN — the details the legal pages depend on.

   Everything a human has to decide lives here rather than buried in the page
   copy. Change it once and both /privacy and /terms follow.
   =========================================================================== */

/** Bump this whenever the wording of either page changes materially. */
export const LEGAL_UPDATED = "20 September 2026";

/* The trading name. A brand, not a legal entity.

   It was OPERATOR, and the terms named it as the party users contracted with
   -- "a binding agreement between you and Nexara". No such entity exists, so
   that agreement named a party that could not be held to it, and it
   contradicted a Paddle application filed by an individual.

   Removing it left the opposite problem: the contract was then with the
   service itself, which is also not a legal person, and the terms named
   nobody at all. The party is TRADER below; this appears alongside it as the
   name he trades under, which is what it always actually was. */
export const STUDIO = "Nexara";
export const SERVICE = "RingBornn";
export const SITE = "ringbornn.com";

/** The person legally party to the terms.
 *
 *  The terms used to name no seller at all. "We" was defined as the service
 *  itself, "run as a sole trader business based in Uzbekistan" — a brand and a
 *  country, with no identifiable person behind them. That is a gap against
 *  Paddle's published domain-review checklist, which asks for "the company
 *  name or sole proprietor's brand (legal name preferred for sole
 *  proprietors) in the Terms & Conditions", and it is also what consumer law
 *  generally expects: someone entering a contract is entitled to know who
 *  with.
 *
 *  MUST MATCH the name on his ID and on the Paddle account exactly. A
 *  mismatch between the site and the documents is the kind of thing that
 *  fails a verification for a reason nobody explains.
 *
 *  The legal pages carry `noindex` (see app/terms, app/privacy, app/refunds)
 *  so this is visible to a customer or a reviewer who opens the page, but is
 *  not collected into search results. */
export const TRADER = "Muratov Baxrom";

/** Robots directive shared by the three legal pages.
 *
 *  They must stay crawlable in robots.txt for this to work at all — a
 *  Disallow would stop the crawler ever reading the noindex, and Google can
 *  still list a blocked URL it has never fetched. Allowing the fetch and
 *  refusing the index is the combination that actually keeps a page out. */
export const LEGAL_ROBOTS = { index: false, follow: true } as const;

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
