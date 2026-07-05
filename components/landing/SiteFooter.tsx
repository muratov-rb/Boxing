"use client";

import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/Logo";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-line/70 bg-void">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-sm">
          <Logo href={null} />
          <p className="mt-4 text-sm leading-relaxed text-ash-dim">
            {t("tagline")}
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm text-ash-dim sm:items-end">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-condensed uppercase tracking-widest">
            <a href="#audience" className="transition-colors hover:text-bone">
              {t("whoFor")}
            </a>
            <a href="#features" className="transition-colors hover:text-bone">
              {t("whatsComing")}
            </a>
            <LocaleSwitcher />
          </div>
          <p className="text-xs">{t("rights", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
