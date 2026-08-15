import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/legal";

/* Which pages search engines should know about.

   Only pages a signed-out visitor can actually reach are listed. Everything
   behind the login wall is left out on purpose: a crawler following
   /dashboard gets a redirect to /login, and a sitemap full of redirects is
   how a small site teaches Google to trust it less. The admin path is absent
   for a stronger reason — it is meant to be undiscoverable, and publishing it
   here would undo that completely. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/plans`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/lessons`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/technique`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/register`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/refunds`, changeFrequency: "yearly", priority: 0.3 },
  ];

  return pages.map((page) => ({ ...page, lastModified }));
}
