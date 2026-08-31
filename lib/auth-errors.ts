/* Turning a Supabase auth failure into something the reader's language can say.

   The sign-in form printed `err.message` straight from the SDK, so a Russian
   user typing the wrong password met "Invalid login credentials" in English --
   the one moment in the app where someone is already frustrated.

   Supabase attaches a stable `code` to auth errors, which is what this maps.
   The message text is not matched on: it is English prose that changes between
   releases, and matching it would break silently on an upgrade. */

/** Message keys in the "auth" namespace, one per case worth naming. */
const BY_CODE: Record<string, string> = {
  invalid_credentials: "errInvalidLogin",
  email_not_confirmed: "errNotConfirmed",
  user_banned: "errBanned",
  over_request_rate_limit: "errTooFast",
  over_email_send_rate_limit: "errTooFast",
  weak_password: "errWeakPassword",
  user_already_exists: "errAlreadyRegistered",
  email_exists: "errAlreadyRegistered",
  signup_disabled: "errSignupsClosed",
  otp_expired: "errCodeExpired",
  email_address_invalid: "errBadEmail",
  validation_failed: "errBadEmail",
};

/**
 * The "auth" namespace message key for this error, or null when the code is
 * one we have not named -- the caller then picks a fallback in whatever
 * namespace it is translating against. Never returns the provider's own text:
 * an unmapped code should read as a generic failure rather than leak English.
 */
export function authErrorKey(err: unknown): string | null {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code?: unknown }).code ?? "")
      : "";
  return BY_CODE[code] ?? null;
}
