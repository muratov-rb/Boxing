/* Single source of truth for the languages the app ships.
   Add a language by: (1) creating messages/<code>.json (may be partial — the
   request config merges it over English so gaps never break), and (2) adding
   a row here. `native` is the label shown in the language menu. */

export interface LocaleMeta {
  code: string;
  native: string; // name in its own language (menu label)
  english: string; // name in English (accessibility / tooltip)
  rtl?: boolean; // right-to-left script (Arabic, Hebrew, …)
}

/* Only languages with a real catalog in messages/ are listed here — a row is
   added as each translation lands, so the menu never offers an English-only
   locale. Next waves: ar (rtl), hi, uz + de, it, pt, nl, pl, uk, tr, … */
export const LOCALES: LocaleMeta[] = [
  { code: "en", native: "English", english: "English" },
  { code: "ru", native: "Русский", english: "Russian" },
  { code: "es", native: "Español", english: "Spanish" },
  { code: "fr", native: "Français", english: "French" },
  { code: "zh", native: "中文", english: "Chinese" },
];

export const DEFAULT_LOCALE = "en";
export const LOCALE_COOKIE = "locale";

export const LOCALE_CODES = LOCALES.map((l) => l.code);

export function isSupportedLocale(code: string | undefined | null): boolean {
  return !!code && LOCALE_CODES.includes(code);
}

export function localeMeta(code: string): LocaleMeta | undefined {
  return LOCALES.find((l) => l.code === code);
}

export function isRtlLocale(code: string): boolean {
  return !!localeMeta(code)?.rtl;
}
