"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/Logo";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function SiteNav({ authed = false }: { authed?: boolean }) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-void/70 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#audience"
            className="font-condensed text-sm uppercase tracking-widest text-ash transition-colors hover:text-bone"
          >
            {t("whoFor")}
          </a>
          <a
            href="#features"
            className="font-condensed text-sm uppercase tracking-widest text-ash transition-colors hover:text-bone"
          >
            {t("whatsComing")}
          </a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline-flex">
            <ThemeToggle />
          </span>
          <LocaleSwitcher />
          {authed ? (
            <Link href="/dashboard" className="btn btn-primary !px-3.5 !py-2 text-sm sm:!px-5 sm:!py-2.5">
              {t("dashboard")}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden font-condensed text-sm uppercase tracking-widest text-ash transition-colors hover:text-bone sm:inline"
              >
                {t("login")}
              </Link>
              <Link
                href="/onboarding"
                className="btn btn-primary !px-3.5 !py-2 text-sm sm:!px-5 sm:!py-2.5"
              >
                {t("start")}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
