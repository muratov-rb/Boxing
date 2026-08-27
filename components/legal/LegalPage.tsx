"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LEGAL_UPDATED } from "@/lib/legal";

/* Shared chrome and typography for /privacy and /terms.

   The body copy is passed as data rather than JSX so the two pages stay
   structurally identical and the prose has nowhere to drift. A plain string is
   a paragraph, an array is a bullet list. */

/* Titles stay in English here on purpose: these are the legal documents
   themselves, and the note above this row says the English text is the one
   that applies. */
const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refunds", label: "Refunds" },
] as const;

export type Block = string | string[];

export interface Section {
  heading: string;
  blocks: Block[];
}

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string[];
  sections: Section[];
}) {
  const pathname = usePathname();

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
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="kicker">Legal</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.25rem)] uppercase leading-none">
          {title}
        </h1>
        <p className="mt-3 font-condensed text-xs uppercase tracking-widest text-ash-dim">
          Last updated {LEGAL_UPDATED}
        </p>

        <div className="mt-8 space-y-4">
          {intro.map((p) => (
            <p key={p} className="leading-relaxed text-ash">
              {p}
            </p>
          ))}
        </div>

        <nav className="panel mt-10 p-5">
          <p className="font-condensed text-xs font-bold uppercase tracking-widest text-ash">
            Contents
          </p>
          <ol className="mt-3 space-y-1.5">
            {sections.map((s, i) => (
              <li key={s.heading}>
                <a
                  href={`#s${i + 1}`}
                  className="text-sm text-ash transition-colors hover:text-blood"
                >
                  {i + 1}. {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {sections.map((s, i) => (
            <section key={s.heading} id={`s${i + 1}`} className="scroll-mt-20">
              <h2 className="font-display text-xl uppercase leading-tight sm:text-2xl">
                <span className="text-blood">{i + 1}.</span> {s.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {s.blocks.map((b, j) =>
                  Array.isArray(b) ? (
                    <ul key={j} className="space-y-2 pl-1">
                      {b.map((item) => (
                        <li key={item} className="flex gap-3 text-ash">
                          <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blood" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={j} className="leading-relaxed text-ash">
                      {b}
                    </p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-line/70 pt-6 text-xs leading-relaxed text-ash-dim">
          This page is published in English. Translations elsewhere in the app
          are provided for convenience; the English text is the one that
          applies.
        </p>

        {/* The other two documents, never the one being read. A "Privacy
            Policy" button at the bottom of the privacy policy looks like it
            goes somewhere and does not, which is exactly the kind of small
            wrongness that makes a legal page feel untrustworthy. */}
        <div className="mt-6 flex flex-wrap gap-3">
          {LEGAL_LINKS.filter((l) => l.href !== pathname).map((l) => (
            <Link key={l.href} href={l.href} className="btn btn-ghost !px-4 !py-2 text-xs">
              {l.label}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
