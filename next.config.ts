import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/* Response hardening.

   Vercel already sends HSTS; everything below was missing. None of it defends
   against a bug in our own code — it limits what someone else's page can do
   with ours. frame-ancestors/X-Frame-Options is the one that matters most
   here: without it any site can iframe the checkout and overlay it.

   No full CSP yet. The layout ships two inline <script> tags (the theme
   pre-paint and the public Supabase pair), so a script-src policy needs a
   nonce threaded through both or it breaks the site on the first deploy.
   Worth doing deliberately, not as a one-line addition. */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  /* The scanner needs the camera on our own origin and nothing else needs
     anything. Embedded frames get none of it. */
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // allows an isolated build dir (e.g. for CI/verification) without clobbering
  // a running dev server's .next cache; defaults to the standard ".next"
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // no need to advertise the framework and version to a scanner
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
