import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Space_Grotesk, Oswald, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { publicSupabaseEnv } from "@/lib/supabase/config";
import { isRtlLocale } from "@/i18n/locales";
import { SITE_URL } from "@/lib/legal";
import { StructuredData } from "@/components/seo/StructuredData";
import "./globals.css";

/* Geometric display — modern, athletic headlines (Sport Modern direction).
   Space Grotesk is Latin-only, so the --font-display stack falls through to
   Inter for Cyrillic (RU) and to script fonts for CJK/Arabic/Devanagari. */
const spaceGrotesk = Space_Grotesk({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
  adjustFontFallback: false,
});

/* Condensed UI type — labels, buttons, subheads (latin + cyrillic for RU) */
const oswald = Oswald({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-oswald",
  display: "swap",
});

/* Clean body copy */
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  /* metadataBase resolves the relative OG image to an absolute URL. Without
     it Next warns at build time and social platforms get a relative path they
     cannot fetch, so the preview falls back to a blank card. */
  metadataBase: new URL(SITE_URL),
  title: "RingBornn — Train Like a Fighter. Look Like an Athlete.",
  description:
    "Web-first boxing training for everyone — from total beginners to seasoned pros. AI-built plans, progress ranks, nutrition and technique. Start free, no app and no gear required.",
  openGraph: {
    type: "website",
    siteName: "RingBornn",
    title: "RingBornn — Train Like a Fighter. Look Like an Athlete.",
    description:
      "Web-first boxing training for beginners and pros. AI-built plans, progress ranks, nutrition and technique. Start free — no card, no app, no gear.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "RingBornn — Train Like a Fighter. Look Like an Athlete.",
    description:
      "Web-first boxing training for beginners and pros. Start free — no card, no app, no gear.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const store = await cookies();
  /* A saved choice wins; with no cookie we let the device decide, which the
     inline script below does before first paint. The server can't read
     prefers-color-scheme, so it renders neutral and the script corrects it —
     without that, a phone in dark mode got a white flash then a light site it
     never asked for. */
  const themeCookie = store.get("theme")?.value;
  const isDark = themeCookie === "dark";
  const themeChosen = themeCookie === "dark" || themeCookie === "light";

  /* Public Supabase pair, read at request time and handed to the client —
     keeps auth working even when a cached build inlined stale empty values. */
  const envScript = `window.__PRESSURE_ENV=${JSON.stringify(publicSupabaseEnv()).replace(/</g, "\\u003c")}`;

  /* Runs before the rest of the body paints, so there is no flash of the wrong
     theme. Only needed when the visitor has never chosen: once the cookie
     exists the server has already put the class on <html>.

     It goes first inside <body>, NOT in a hand-written <head> — App Router
     owns the head, and adding one produces whitespace text nodes that break
     hydration for the whole page. */
  const themeScript = themeChosen
    ? ""
    : `try{if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark')}catch(e){}`;

  return (
    <html
      lang={locale}
      dir={isRtlLocale(locale) ? "rtl" : "ltr"}
      className={`${spaceGrotesk.variable} ${oswald.variable} ${inter.variable} h-full antialiased${isDark ? " dark" : ""}`}
    >
      <body className="min-h-full">
        {themeScript ? <script dangerouslySetInnerHTML={{ __html: themeScript }} /> : null}
        <script dangerouslySetInnerHTML={{ __html: envScript }} />
        <StructuredData />
        <div className="brush" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
