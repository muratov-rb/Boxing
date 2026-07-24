import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Anton, Oswald, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { publicSupabaseEnv } from "@/lib/supabase/config";
import { isRtlLocale } from "@/i18n/locales";
import "./globals.css";

/* Heavy condensed display — fight-poster headlines */
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
  // drop the auto system fallback so Cyrillic (RU) falls through to Oswald,
  // set in the --font-display stack, instead of a plain system sans
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
  title: "RingBornn — Train Like a Fighter. Look Like an Athlete.",
  description:
    "Free, web-first boxing training for everyone — from total beginners to seasoned pros. AI-built plans, progress ranks, nutrition and technique, no app and no gear required.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const store = await cookies();
  const isDark = store.get("theme")?.value === "dark";

  /* Public Supabase pair, read at request time and handed to the client —
     keeps auth working even when a cached build inlined stale empty values. */
  const envScript = `window.__PRESSURE_ENV=${JSON.stringify(publicSupabaseEnv()).replace(/</g, "\\u003c")}`;

  return (
    <html
      lang={locale}
      dir={isRtlLocale(locale) ? "rtl" : "ltr"}
      className={`${anton.variable} ${oswald.variable} ${inter.variable} h-full antialiased${isDark ? " dark" : ""}`}
    >
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: envScript }} />
        <div className="aura" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
