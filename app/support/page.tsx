import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icon } from "@/components/ui/Icons";
import { SupportForm } from "@/components/support/SupportForm";
import { SupportThreads } from "@/components/support/SupportThreads";
import { getUser } from "@/lib/supabase/user";
import { CONTACT_EMAIL, CONTACT_TELEGRAM, SERVICE } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Support — ${SERVICE}`,
  description:
    "Report a problem, ask about billing, or request your data. We read every message.",
};

/* Public on purpose — see the note in SupportForm. The session is read only to
   pre-fill the reply address, and its absence is not an error. */
export default async function SupportPage() {
  const t = await getTranslations("support");
  const user = await getUser();

  /* Answers that do not need us. Every one of these is a ticket that would
     otherwise be written, waited on, and answered with a link. */
  const selfServe = [
    { href: "/profile", key: "selfPlan", icon: "card" },
    { href: "/refunds", key: "selfRefund", icon: "arrow" },
    { href: "/privacy", key: "selfData", icon: "lock" },
  ] as const;

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
              {t("home")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.25rem)] uppercase leading-none">
          {t("titlePre")}
          <span className="text-blood">{t("titleAccent")}</span>
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ash">{t("intro")}</p>

        {/* things you can do without waiting for us */}
        <section className="mt-8 grid gap-2 sm:grid-cols-3">
          {selfServe.map(({ href, key, icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:border-blood/50"
            >
              <span className="flex items-center gap-2.5">
                <span className="text-ash-dim transition-colors group-hover:text-blood">
                  <Icon name={icon} size={15} />
                </span>
                <span className="text-sm text-bone">{t(key)}</span>
              </span>
              <span className="text-ash-dim transition-transform group-hover:translate-x-0.5 group-hover:text-blood">
                <Icon name="arrow" size={14} />
              </span>
            </Link>
          ))}
        </section>

        <div className="mt-10">
          <SupportForm email={user?.email ?? null} />
        </div>

        {/* Answers arrive here, not only by email. Signed-out visitors have no
            account to hang a thread on, so they see nothing and this renders
            no empty state for them. */}
        {user && <SupportThreads locale={await getLocale()} />}

        {/* the other ways to reach a human */}
        <section className="panel mt-4 p-6">
          <h2 className="font-condensed text-sm font-bold uppercase tracking-widest text-ash">
            {t("otherTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ash">{t("otherBody")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CONTACT_EMAIL && (
              <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-ghost !px-5 !py-2.5 text-xs">
                {CONTACT_EMAIL}
              </a>
            )}
            <a
              href={CONTACT_TELEGRAM}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost !px-5 !py-2.5 text-xs"
            >
              <Icon name="telegram" size={14} />
              {t("otherTelegram")}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
