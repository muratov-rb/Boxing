import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { adminPath, adminPathIsSecret, DEFAULT_ADMIN_PATH } from "@/lib/admin-path";
import { SITE } from "@/lib/legal";

/* The address Vercel generated before the real domain was bought. It still
   serves the identical site, which splits search ranking between two hosts
   and lets the old name circulate. Anything arriving there is moved to the
   real domain, path and query intact. */
const LEGACY_HOST = "boxing-murex.vercel.app";


/* ===========================================================================
   Content-Security-Policy.

   script-src is nonce-based, which means it cannot live in next.config.ts:
   a static header cannot carry a value that changes every request. The nonce
   is minted here, put on the REQUEST headers so the layout can stamp it onto
   its two inline scripts, and on the RESPONSE headers as the policy itself.
   Next reads it back off the request header and nonces its own bootstrap
   scripts with it.

   'strict-dynamic' is what lets those nonced scripts go on to load the app's
   chunks. Without it every chunk URL would need listing.

   style-src keeps 'unsafe-inline': Next inlines critical CSS, and there is no
   nonce hook for it. Styles are a far weaker vector than scripts.
   =========================================================================== */
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline'",
    /* avatars come from Supabase storage; data: and blob: are the canvas
       resize step and the scanner's own preview */
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    /* Supabase for auth and data; Paddle for checkout */
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.paddle.com",
    "frame-src https://*.paddle.com",
    "form-action 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ");
}

// Next.js 16 renamed the "middleware" convention to "proxy" (same behavior).
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  /* The layout reads these to stamp its inline scripts; Next reads the CSP
     header to nonce the scripts it injects itself. */
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  const withCsp = <T extends Response>(res: T): T => {
    res.headers.set("content-security-policy", csp);
    return res;
  };

  /* 308 rather than 302: permanent is what tells a search engine to transfer
     the ranking to the new host instead of indexing both, and it preserves the
     method so a POST is not silently turned into a GET. */
  if (request.headers.get("host") === LEGACY_HOST) {
    const url = request.nextUrl.clone();
    url.host = SITE;
    url.port = "";
    url.protocol = "https";
    return NextResponse.redirect(url, 308);
  }

  /* /dev/* are internal build tools (model baking, frame rendering). They are
     harmless — the routes they post to already 404 in production — but there
     is no reason to serve them to the public, so hide them entirely. */
  if (process.env.NODE_ENV === "production" && path.startsWith("/dev")) {
    return new NextResponse(null, { status: 404 });
  }

  /* Once ADMIN_PATH is set, the old /admin stops existing. A 404 with no body
     is what a never-built route returns, so a scanner cannot tell the panel
     was ever here — and the login form is never rendered to be attacked. */
  if (adminPathIsSecret() && path.startsWith(DEFAULT_ADMIN_PATH)) {
    return new NextResponse(null, { status: 404 });
  }

  /* The panel lives at one path but is built as app/admin. Rewrite rather than
     redirect: a redirect would put the secret path in the browser's address
     bar of anyone who guessed, and leak it through the Referer header. */
  if (adminPathIsSecret()) {
    const secret = adminPath();
    if (path === secret || path.startsWith(`${secret}/`)) {
      const url = request.nextUrl.clone();
      url.pathname = DEFAULT_ADMIN_PATH + path.slice(secret.length);
      return withCsp(
        NextResponse.rewrite(url, {
          request: { headers: requestHeaders },
          /* Never let it into a search index, whatever the path is called. */
          headers: { "x-robots-tag": "noindex, nofollow, noarchive" },
        }),
      );
    }
  }
  /* The dev tooling endpoints carry no session and are hit hundreds of times
     per render. Refreshing the Supabase session on each one adds a round trip
     — and stalls the whole render when Supabase is unreachable. */
  if (path.startsWith("/api/dev-")) {
    return NextResponse.next({ request });
  }
  return withCsp(await updateSession(request, requestHeaders));
}

export const config = {
  matcher: [
    /* everything except static assets */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
