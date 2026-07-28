/* ===========================================================================
   RINGBORNN — password rules.

   One constant, because three places have to agree: the input's minLength, the
   check before we call Supabase, and the hint under the field. If they drift,
   someone types a password the form accepts and the server rejects, with no
   explanation of which one was lying.

   This must also match the "Minimum password length" set in Supabase
   (Authentication → Auth Providers → Email). The app is the friendlier of the
   two — it explains the rule before you submit — but Supabase is the one that
   actually enforces it, so the dashboard value is the real floor.

   Ten rather than the Supabase default of six: leaked-password checking
   (HaveIBeenPwned) is Pro-plan only and this project is on Free, so length is
   the protection we actually have against credential stuffing.
   =========================================================================== */

export const MIN_PASSWORD_LENGTH = 10;

/** True when the password clears the length rule. */
export function passwordLongEnough(pw: string): boolean {
  return pw.length >= MIN_PASSWORD_LENGTH;
}
