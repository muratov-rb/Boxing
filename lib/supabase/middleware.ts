import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "./config";

/* Routes that require an account. Onboarding collects the user's stats, so we
   want them signed in first — "create a profile" → auth → statistics.

   THIS LIST IS THE GATE. A `redirect()` inside the page's own server component
   is not a substitute and must not be relied on alone: /circuits shipped with
   exactly that guard and still served itself to signed-out visitors, because a
   route absent from this list never gets the session resolved on the way in.
   Adding a page that needs an account means adding it here. */
const PROTECTED = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/calories",
  "/circuits",
  "/friends",
  /* These three render training content and drive the AI routes. They were
     never in this list, so they answered to the open internet while /calories
     and /circuits next to them did not -- an inconsistency by accident rather
     than by decision. No money leaked (every AI route checks auth on its own
     and always did), but a signed-out visitor reached a page built entirely
     around a plan they do not have. */
  "/lessons",
  "/train",
  "/nutrition",
];

/* Refreshes the Supabase session cookie and guards protected routes.
   No-op when Supabase isn't configured yet, so the app still runs. */
export async function updateSession(
  request: NextRequest,
  /* Carries the per-request CSP nonce through to the layout. */
  requestHeaders?: Headers,
) {
  const next = () =>
    requestHeaders
      ? NextResponse.next({ request: { headers: requestHeaders } })
      : NextResponse.next({ request });
  const response = next();

  if (!isSupabaseConfigured()) return response;

  /* Nothing below this line is free: creating the client and calling getUser()
     is a network round-trip to Supabase, and it used to run on EVERY request —
     including anonymous visits to the landing page, which have no session to
     read and no redirect to make. It was the single biggest contributor to
     time-to-first-byte on public pages.

     Only the protected routes need the answer, so only they pay for it. A
     signed-in user's token still refreshes: every protected page goes through
     here, and the browser client refreshes on its own besides. */
  const path = request.nextUrl.pathname;
  if (!PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    return response;
  }

  return guardProtected(request, requestHeaders);
}

async function guardProtected(request: NextRequest, requestHeaders?: Headers) {
  const next = () =>
    requestHeaders
      ? NextResponse.next({ request: { headers: requestHeaders } })
      : NextResponse.next({ request });
  let response = next();

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        /* next() rather than NextResponse.next(request): rebuilding the
           response here must not drop the CSP nonce headers. */
        response = next();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const path = request.nextUrl.pathname;
    const url = request.nextUrl.clone();
    // log in is always the first step (the login screen links to "create an
    // account" for new users), then they continue to the page they wanted
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}
