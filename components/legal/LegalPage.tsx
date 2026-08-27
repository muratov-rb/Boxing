"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LEGAL_UPDATED } from "@/lib/legal";

/* Shared chrome and typography for /privacy, /terms and /refunds.

   The body copy is passed as data rather than JSX so the three pages stay
   structurally identical and the prose has nowhere to drift. A single Loc is a
   paragraph, an array of them is a bullet list.

   The text lives in the page files rather than the message catalogue on
   purpose: the catalogue is serialised into the HTML of *every* page, and
   these three documents are several times the size of the rest of it put
   together. Here, each document is downloaded only by someone reading it. */

export type Locale = "en" | "ru" | "es" | "fr" | "zh";

/** One string in every language the app speaks. */
export type Loc = Record<Locale, string>;

export type Block = Loc | Loc[];

export interface Section {
  heading: Loc;
  blocks: Block[];
}

function pick(value: Loc, locale: string): string {
  return value[(locale as Locale) in value ? (locale as Locale) : "en"];
}

const CHROME = {
  home: { en: "Home", ru: "На главную", es: "Inicio", fr: "Accueil", zh: "首页" },
  legal: { en: "Legal", ru: "Правовая информация", es: "Legal", fr: "Mentions légales", zh: "法律条款" },
  updated: {
    en: "Last updated",
    ru: "Обновлено",
    es: "Última actualización",
    fr: "Dernière mise à jour",
    zh: "最后更新",
  },
  contents: { en: "Contents", ru: "Содержание", es: "Contenido", fr: "Sommaire", zh: "目录" },
  /* Every translated document says which version governs. Naming one
     authoritative language is what stops a translation error becoming the
     wording a regulator reads -- so the documents are translated for
     readability and the English text remains the binding one. */
  prevails: {
    en: "This translation is provided for convenience. The English version of this document is the one that legally applies.",
    ru: "Этот перевод предоставлен для удобства. Юридическую силу имеет английская версия документа.",
    es: "Esta traducción se ofrece por comodidad. La versión en inglés de este documento es la que tiene validez legal.",
    fr: "Cette traduction est fournie à titre de commodité. Seule la version anglaise de ce document fait foi.",
    zh: "本译文仅供参考。具有法律效力的是本文件的英文版本。",
  },
} satisfies Record<string, Loc>;

const LEGAL_LINKS: { href: string; label: Loc }[] = [
  {
    href: "/privacy",
    label: {
      en: "Privacy Policy",
      ru: "Политика конфиденциальности",
      es: "Política de privacidad",
      fr: "Politique de confidentialité",
      zh: "隐私政策",
    },
  },
  {
    href: "/terms",
    label: {
      en: "Terms of Service",
      ru: "Условия использования",
      es: "Términos del servicio",
      fr: "Conditions d'utilisation",
      zh: "服务条款",
    },
  },
  {
    href: "/refunds",
    label: { en: "Refunds", ru: "Возвраты", es: "Reembolsos", fr: "Remboursements", zh: "退款" },
  },
];

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: Loc;
  intro: Loc[];
  sections: Section[];
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const p = (v: Loc) => pick(v, locale);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-void/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="font-condensed text-xs uppercase tracking-widest text-ash transition-colors hover:text-bone sm:text-sm"
            >
              {p(CHROME.home)}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="kicker">{p(CHROME.legal)}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.25rem)] uppercase leading-none">
          {p(title)}
        </h1>
        <p className="mt-3 font-condensed text-xs uppercase tracking-widest text-ash-dim">
          {p(CHROME.updated)} {LEGAL_UPDATED}
        </p>

        <div className="mt-8 space-y-4">
          {intro.map((block, i) => (
            <p key={i} className="leading-relaxed text-ash">
              {p(block)}
            </p>
          ))}
        </div>

        <nav className="panel mt-10 p-5">
          <p className="font-condensed text-xs font-bold uppercase tracking-widest text-ash">
            {p(CHROME.contents)}
          </p>
          <ol className="mt-3 space-y-1.5">
            {sections.map((s, i) => (
              <li key={s.heading.en}>
                <a
                  href={`#s${i + 1}`}
                  className="text-sm text-ash transition-colors hover:text-blood"
                >
                  {i + 1}. {p(s.heading)}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {sections.map((s, i) => (
            <section key={s.heading.en} id={`s${i + 1}`} className="scroll-mt-20">
              <h2 className="font-display text-xl uppercase leading-tight sm:text-2xl">
                <span className="text-blood">{i + 1}.</span> {p(s.heading)}
              </h2>
              <div className="mt-4 space-y-4">
                {s.blocks.map((b, j) =>
                  Array.isArray(b) ? (
                    <ul key={j} className="space-y-2 pl-1">
                      {b.map((item, k) => (
                        <li key={k} className="flex gap-3 text-ash">
                          <span
                            aria-hidden="true"
                            className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blood"
                          />
                          <span className="leading-relaxed">{p(item)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={j} className="leading-relaxed text-ash">
                      {p(b)}
                    </p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Shown only when you are not reading the version that governs. */}
        {locale !== "en" && (
          <p className="mt-12 border-t border-line/70 pt-6 text-xs leading-relaxed text-ash-dim">
            {p(CHROME.prevails)}
          </p>
        )}

        {/* The other two documents, never the one being read. A "Privacy
            Policy" button at the bottom of the privacy policy looks like it
            goes somewhere and does not, which is exactly the kind of small
            wrongness that makes a legal page feel untrustworthy. */}
        <div className="mt-6 flex flex-wrap gap-3">
          {LEGAL_LINKS.filter((l) => l.href !== pathname).map((l) => (
            <Link key={l.href} href={l.href} className="btn btn-ghost !px-4 !py-2 text-xs">
              {p(l.label)}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
