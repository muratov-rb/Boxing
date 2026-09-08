/* The Paddle.js browser token, read the way every other public value here is.

   NEXT_PUBLIC_* is inlined at BUILD time. This project already learned that
   the hard way with Supabase: a build that ran before the variable existed
   bakes in an empty string and keeps serving it until something forces a
   rebuild, with no error to explain why. So the root layout also hands the
   value to the browser at request time on window.__PRESSURE_ENV, and this
   prefers the inlined copy but falls back to that bridge.

   Public on purpose, unlike PADDLE_API_KEY: a client-side token is meant to
   be readable in the page source, and on its own it can only open a checkout
   for a transaction the server already created. */

/** Name kept in one place — it appears in the layout, here, and .env.example. */
export const PADDLE_TOKEN_KEY = "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN";

export function paddleClientToken(): string {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ||
      window.__PRESSURE_ENV?.[PADDLE_TOKEN_KEY] ||
      ""
    );
  }
  return process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";
}

/** Which Paddle to talk to, decided by the token's own prefix rather than a
    second variable that could disagree with it and point a real card at the
    sandbox. */
export function paddleEnvironment(token: string): "sandbox" | "production" {
  return token.startsWith("test_") ? "sandbox" : "production";
}
