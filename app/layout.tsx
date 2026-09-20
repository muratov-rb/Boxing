import type { Metadata } from "next";
import { PADDLE_TOKEN_KEY } from "@/lib/paddle-client";
import { VAPID_KEY } from "@/lib/push-keys";
import { cookies, headers } from "next/headers";
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
  /* The whole catalogue is serialised into the HTML of every page, so anything
     left in here is downloaded by people who will never see it. The admin
     panel is the clearest case: its strings name environment variables and
     explain how to fix a Supabase key, and they were shipping to every
     visitor on every page. /admin supplies them to itself instead. */
  const { admin: _admin, ...messages } = await getMessages();
  const store = await cookies();
  /* Minted per request in proxy.ts. Both inline scripts below must carry it
     or the CSP blocks them -- and the env one is what auth reads. */
  const nonce = (await headers()).get("x-nonce") ?? undefined;
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
  const envScript = `window.__PRESSURE_ENV=${JSON.stringify({
    ...publicSupabaseEnv(),
    /* Paddle.js needs this in the browser, and this is the ONLY way it gets
       there. It is read from a plain server variable, not a NEXT_PUBLIC_ one:
       the build-time copy was redundant next to this bridge, and the prefix
       made Vercel flag the project for exposing a variable -- intended for this
       token, but indistinguishable to a scanner from a real leak, and noise
       like that hides the alert that matters. */
    [PADDLE_TOKEN_KEY]: process.env.PADDLE_CLIENT_TOKEN ?? "",
    /* The public half of the VAPID pair, which the browser needs in order to
       subscribe for reminders that arrive with the app closed. Public by
       definition -- it identifies this server to the push service and
       authorises nothing. VAPID_PRIVATE_KEY is the half that signs, and it
       never leaves the server. Same reasoning as the Paddle token above for
       why there is no NEXT_PUBLIC_ prefix. */
    [VAPID_KEY]: process.env.VAPID_PUBLIC_KEY ?? "",
    /* The escape below must stay TWO backslashes in this source. It turns
       every "<" into the six characters \u003c, so no value can close the
       script tag early. One backslash is a unicode escape for "<" itself,
       which makes the replace a silent no-op -- a shell-scripted edit
       collapsed it to exactly that on 2026-09-08, and nothing in the output
       looks any different, so it went unnoticed for nine days. */
  }).replace(/</g, "\\u003c")}`;

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
        {themeScript ? (
          <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
        ) : null}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: envScript }} />
        <StructuredData nonce={nonce} />
        <div className="brush" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
