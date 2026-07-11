"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";

export function FinalCTA() {
  const t = useTranslations("finalCta");

  return (
    <section className="relative overflow-hidden border-t border-line/70 bg-charcoal">
      {/* red wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 120% at 50% 0%, rgba(224,16,41,0.16), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 sm:py-28">
        <p className="kicker justify-center">{t("kicker")}</p>
        <h2 className="mt-6 font-display text-[clamp(2.4rem,7vw,5rem)] uppercase leading-[0.9]">
          {t("titlePre")}
          <span className="text-blood">{t("titleAccent")}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-md text-ash">{t("sub")}</p>
        <div className="mt-10 flex justify-center">
          <Link href="/onboarding" className="btn btn-primary shine text-base">
            {t("cta")}
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
