import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { adminPath, adminPathIsSecret, DEFAULT_ADMIN_PATH } from "@/lib/admin-path";

// Next.js 16 renamed the "middleware" convention to "proxy" (same behavior).
export async function proxy(request: NextRequest) {
  /* /dev/* are internal build tools (model baking, frame rendering). They are
     harmless — the routes they post to already 404 in production — but there
     is no reason to serve them to the public, so hide them entirely. */
  const path = request.nextUrl.pathname;
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
      return NextResponse.rewrite(url, {
        /* Never let it into a search index, whatever the path is called. */
        headers: { "x-robots-tag": "noindex, nofollow, noarchive" },
      });
    }
  }
  /* The dev tooling endpoints carry no session and are hit hundreds of times
     per render. Refreshing the Supabase session on each one adds a round trip
     — and stalls the whole render when Supabase is unreachable. */
  if (path.startsWith("/api/dev-")) {
    return NextResponse.next({ request });
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /* everything except static assets */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
