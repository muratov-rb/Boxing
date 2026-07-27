import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed the "middleware" convention to "proxy" (same behavior).
export async function proxy(request: NextRequest) {
  /* /dev/* are internal build tools (model baking, frame rendering). They are
     harmless — the routes they post to already 404 in production — but there
     is no reason to serve them to the public, so hide them entirely. */
  const path = request.nextUrl.pathname;
  if (process.env.NODE_ENV === "production" && path.startsWith("/dev")) {
    return new NextResponse(null, { status: 404 });
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
