"use client";

import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/Logo";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { Icon } from "@/components/ui/Icons";

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
          <div className="mt-4 flex items-center gap-3">
            <a
              href="https://t.me/ringbornn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="RingBornn on Telegram"
              title="Telegram — t.me/ringbornn"
              className="grid h-9 w-9 place-items-center rounded-full border border-line text-ash transition-colors hover:border-blood hover:text-blood"
            >
              <Icon name="telegram" size={17} />
            </a>
            <a
              href="https://instagram.com/ring.bornn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="RingBornn on Instagram"
              title="Instagram — @ring.bornn"
              className="grid h-9 w-9 place-items-center rounded-full border border-line text-ash transition-colors hover:border-blood hover:text-blood"
            >
              <Icon name="instagram" size={17} />
            </a>
            <span className="font-condensed text-xs uppercase tracking-widest text-ash-dim">
              @ring.bornn
            </span>
          </div>
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
