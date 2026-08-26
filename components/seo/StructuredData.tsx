import { CONTACT_EMAIL, CONTACT_TELEGRAM, OPERATOR, SERVICE, SITE_URL } from "@/lib/legal";

/* Machine-readable identity, for the "my own brand name doesn't find me"
   problem.

   Being indexed is not the same as ranking for your own name. Google has to
   decide that the string "RingBornn" refers to this organisation, and until
   something states that plainly it is guessing from page text alone. This is
   the standard way to say it: the official name, the canonical URL, the logo,
   who operates it, and the social accounts that carry the same name.

   Rendered on the server as a plain script tag — no library, no runtime cost,
   and crawlers read it in the first response. */

const INSTAGRAM = "https://instagram.com/ring.bornn";

export function StructuredData() {
  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SERVICE,
      /* Search engines match a query against these too, which is why the
         spaced and lower-case forms people actually type are listed. */
      alternateName: ["Ring Bornn", "ringbornn"],
      url: SITE_URL,
      logo: `${SITE_URL}/apple-icon`,
      description:
        "Web-first boxing training for beginners and experienced fighters — plans, technique, conditioning circuits, nutrition and coaching guides.",
      foundingLocation: "Uzbekistan",
      parentOrganization: { "@type": "Organization", name: OPERATOR },
      sameAs: [CONTACT_TELEGRAM, INSTAGRAM],
      ...(CONTACT_EMAIL
        ? {
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: CONTACT_EMAIL,
              url: `${SITE_URL}/support`,
            },
          }
        : {}),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SERVICE,
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: ["en", "ru", "es", "fr", "zh"],
    },
  ];

  return (
    <script
      type="application/ld+json"
      /* Escaping "<" stops a value that happens to contain a closing script
         tag from ending this block early. */
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(
          /</g,
          "\\u003c",
        ),
      }}
    />
  );
}
