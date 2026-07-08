"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";

export function Hero() {
  const t = useTranslations("hero");
  const trust = [
    t("trustFree"),
    t("trustNoApp"),
    t("trustNoGear"),
    t("trustRange"),
  ];

  return (
    <section className="relative overflow-hidden">
      {/* decorative backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute -right-10 top-16 hidden select-none font-display text-[22rem] leading-none text-bone/[0.05] lg:block">
          KO
        </span>
        <div className="absolute -left-24 top-1/3 h-px w-[60%] rotate-[-8deg] bg-gradient-to-r from-transparent via-blood/40 to-transparent" />
        <div className="absolute right-0 bottom-24 h-px w-[45%] rotate-[-8deg] bg-gradient-to-r from-transparent via-azure/30 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28 lg:pb-32">
        <p className="kicker animate-rise">{t("kicker")}</p>

        <h1 className="animate-rise mt-6 font-display text-[clamp(2.9rem,9vw,7.5rem)] uppercase text-bone [animation-delay:80ms]">
          {t("title1")}
          <br />
          <span className="text-ash">{t("title2pre")}</span>
          <span className="text-blood">{t("title2accent")}</span>
        </h1>

        <p className="animate-rise mt-7 max-w-xl text-lg leading-relaxed text-ash [animation-delay:160ms]">
          {t("sub")}
        </p>

        <div className="animate-rise mt-9 flex flex-col gap-3 sm:flex-row sm:items-center [animation-delay:240ms]">
          <Link href="/onboarding" className="btn btn-primary shine">
            {t("ctaStart")}
            <Icon name="arrow" size={18} />
          </Link>
          <a href="#features" className="btn btn-ghost">
            {t("ctaInside")}
          </a>
        </div>

        {/* trust strip */}
        <ul className="animate-rise mt-14 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line/70 pt-6 [animation-delay:320ms]">
          {trust.map((label) => (
            <li
              key={label}
              className="flex items-center gap-2 font-condensed text-sm uppercase tracking-wider text-ash"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blood" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
