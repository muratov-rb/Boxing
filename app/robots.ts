import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/legal";

/* Crawl instructions.

   The disallow list covers pages that are useless in an index rather than
   secret: signed-out crawlers only ever get a redirect from them, and API
   routes return JSON no reader wants. Note this file cannot keep anything
   private — robots.txt is a public request, not a lock, and naming a path
   here advertises it. The admin panel is deliberately absent for that reason;
   it is protected by living at an unguessable path, and the proxy already
   returns an empty 404 from /admin. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/profile",
        "/train",
        "/circuits",
        "/calories",
        "/nutrition",
        "/onboarding",
        "/auth/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
