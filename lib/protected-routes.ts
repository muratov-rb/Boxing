/* Routes that require an account — the one list, read by two things that must
   never disagree about it.

   `lib/supabase/middleware.ts` uses it as the actual gate: a route absent from
   here never gets the session resolved on the way in, so a `redirect()`
   inside the page's own component is not a substitute for being listed.

   `app/robots.ts` uses the same list to tell crawlers not to bother. Those
   used to be two hand-kept lists, and they drifted: /lessons and /friends
   were added to the gate when they went behind the login wall, and robots.txt
   was never updated next to it, so Google kept sending its crawler at both
   and walking into a 307 every time.

   No import from either "@supabase/ssr" or "next/server" here on purpose —
   this file is just data, so pulling it into robots.ts (which should be as
   light as the edge runtime that serves it) never drags the auth client in
   with it. */
export const PROTECTED = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/calories",
  "/circuits",
  "/friends",
  "/lessons",
  "/train",
  "/nutrition",
];
