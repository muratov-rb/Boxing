"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import type { IconName } from "@/components/ui/Icons";

interface Corner {
  tagKey: string;
  titleKey: string;
  copyKey: string;
  pointKeys: string[];
  icon: IconName;
}

const CORNERS: Corner[] = [
  {
    tagKey: "redCorner",
    titleKey: "c1Title",
    copyKey: "c1Copy",
    pointKeys: ["c1p1", "c1p2", "c1p3"],
    icon: "gloves",
  },
  {
    tagKey: "blueCorner",
    titleKey: "c2Title",
    copyKey: "c2Copy",
    pointKeys: ["c2p1", "c2p2", "c2p3"],
    icon: "target",
  },
];

export function AudienceSplit() {
  const t = useTranslations("audience");

  return (
    <section id="audience" className="relative border-t border-line/70 bg-charcoal">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="kicker justify-center">{t("kicker")}</p>
          <h2 className="mt-5 font-display text-[clamp(2rem,5vw,3.5rem)] uppercase leading-none">
            {t("titlePre")}
            <span className="text-blood">{t("titleAccent")}</span>
          </h2>
          <p className="mt-5 text-ash">{t("sub")}</p>
        </div>

        <div className="relative mt-14 grid gap-5 md:grid-cols-2">
          {CORNERS.map((c) => (
            <article
              key={c.titleKey}
              className="panel group relative p-8 transition-colors duration-300 hover:border-blood/60 sm:p-10"
            >
              <div className="flex items-center justify-between">
                <span className="badge">{t(c.tagKey)}</span>
                <span className="grid h-11 w-11 place-items-center border border-line text-ash transition-colors group-hover:border-blood/60 group-hover:text-blood">
                  <Icon name={c.icon} size={22} />
                </span>
              </div>

              <h3 className="mt-6 font-condensed text-3xl font-bold uppercase tracking-wide">
                {t(c.titleKey)}
              </h3>
              <p className="mt-3 text-ash">{t(c.copyKey)}</p>

              <ul className="mt-6 space-y-3">
                {c.pointKeys.map((pk) => (
                  <li key={pk} className="flex items-start gap-3 text-sm text-bone/90">
                    <span className="mt-0.5 text-blood">
                      <Icon name="check" size={18} />
                    </span>
                    {t(pk)}
                  </li>
                ))}
              </ul>
            </article>
          ))}

          {/* center seam badge */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <span className="grid h-14 w-14 place-items-center border border-line bg-void font-display text-lg text-blood">
              &
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
