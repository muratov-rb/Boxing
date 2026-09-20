import "server-only";
import en from "@/messages/en.json";
import ru from "@/messages/ru.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import zh from "@/messages/zh.json";

/* Wording for pushes, read from the same catalogues the app itself uses
   rather than copied into the routes. A copy would drift, and the drift would
   only ever be visible on a device that is asleep, where nobody is looking.

   These never reach the browser: "server-only" above makes importing this
   from a client component a build error rather than a silent 300 KB of
   translations added to the bundle. */

const CATALOGUE: Record<string, { remind: Record<string, string> }> = {
  en: en as never,
  ru: ru as never,
  es: es as never,
  fr: fr as never,
  zh: zh as never,
};

/** Fall back key by key, not whole-catalogue: a language that has not
    translated one string should still get the others in its own words. */
export function pushCopy(locale: string): Record<string, string> {
  const chosen = CATALOGUE[locale] ?? CATALOGUE.en;
  return { ...CATALOGUE.en.remind, ...chosen.remind };
}

/** Substitute {at} without a regex — these files have no business containing
    an escape, and this codebase has been bitten by one before. */
export function fill(template: string, at: string): string {
  return (template ?? "").split("{at}").join(at);
}
