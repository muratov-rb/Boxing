/* The Paddle.js browser token.

   It reaches the browser one way only: the root layout reads it from the
   server environment on every request and hands it over on
   window.__PRESSURE_ENV -- the same request-time bridge the public Supabase
   pair uses.

   It used to also be a NEXT_PUBLIC_ variable, inlined into the bundle at
   build time. That copy was redundant next to the bridge, which exists
   precisely because build-time inlining bakes an empty string into any deploy
   built before the variable was set. And the prefix made Vercel flag the
   project for "exposing" an environment variable.

   That flag was a false positive worth removing anyway: a client-side token is
   public by design -- it has to reach every visitor's browser for the payment
   window to open, and on its own it can only open a checkout for a transaction
   the server already created. PADDLE_API_KEY is the one that must never leave
   the server. Removing the prefix does not hide this token; it stops a
   scanner alarm that would otherwise train everyone to ignore that scanner. */

/** Key on window.__PRESSURE_ENV. Set in app/layout.tsx, read below. */
export const PADDLE_TOKEN_KEY = "PADDLE_CLIENT_TOKEN";

export function paddleClientToken(): string {
  if (typeof window !== "undefined") {
    return window.__PRESSURE_ENV?.[PADDLE_TOKEN_KEY] ?? "";
  }
  return process.env.PADDLE_CLIENT_TOKEN ?? "";
}

/** Which Paddle to talk to, decided by the token's own prefix rather than a
    second variable that could disagree with it and point a real card at the
    sandbox. */
export function paddleEnvironment(token: string): "sandbox" | "production" {
  return token.startsWith("test_") ? "sandbox" : "production";
}
