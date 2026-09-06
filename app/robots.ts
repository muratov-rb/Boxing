import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/legal";
import { PROTECTED } from "@/lib/protected-routes";

/* Crawl instructions.

   The disallow list covers pages that are useless in an index rather than
   secret: signed-out crawlers only ever get a redirect from them, and API
   routes return JSON no reader wants. Note this file cannot keep anything
   private — robots.txt is a public request, not a lock, and naming a path
   here advertises it. The admin panel is deliberately absent for that reason;
   it is protected by living at an unguessable path, and the proxy already
   returns an empty 404 from /admin.

   Was a hand-copied list, and it drifted: /lessons and /friends were added to
   PROTECTED when they went behind the login wall, and nobody updated this
   file next to it, so Google was still sending its crawler at both and
   walking straight into a 307. Reading PROTECTED here instead means there is
   only one list to update, and this one cannot fall behind it again. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", ...PROTECTED],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
