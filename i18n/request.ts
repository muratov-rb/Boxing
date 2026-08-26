import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
} from "./locales";

/* Kept for existing imports. */
export const locales = ["en", "ru"] as const;
export type Locale = string;
export const defaultLocale = DEFAULT_LOCALE;
export { LOCALE_COOKIE };

type Dict = Record<string, unknown>;

/* Deep-merge a (partial) translation over the English base so any key a
   language hasn't translated yet falls back to English instead of breaking. */
function deepMerge(base: Dict, over: Dict): Dict {
  const out: Dict = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = out[k];
    if (
      v && typeof v === "object" && !Array.isArray(v) &&
      b && typeof b === "object" && !Array.isArray(b)
    ) {
      out[k] = deepMerge(b as Dict, v as Dict);
    } else if (v !== undefined && v !== "") {
      out[k] = v;
    }
  }
  return out;
}

/* The merged catalogue for a locale, kept between requests.

   deepMerge walks ~700 keys across every namespace and its result depends on
   nothing but the locale — yet it was running on every single request from a
   reader in Russian, Spanish, French or Chinese. Serverless instances survive
   between invocations, so caching it means the merge happens once per instance
   instead of once per page view. English never merged and is unaffected. */
const merged = new Map<string, Dict>();

async function catalogFor(locale: string): Promise<Dict> {
  const hit = merged.get(locale);
  if (hit) return hit;

  const en = (await import(`../messages/en.json`)).default as Dict;
  if (locale === "en") {
    merged.set("en", en);
    return en;
  }

  let messages: Dict;
  try {
    const target = (await import(`../messages/${locale}.json`)).default as Dict;
    messages = deepMerge(en, target);
  } catch {
    messages = en; // catalog missing → English
  }
  merged.set(locale, messages);
  return messages;
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale = isSupportedLocale(cookieLocale) ? cookieLocale! : DEFAULT_LOCALE;

  return { locale, messages: await catalogFor(locale) };
});
