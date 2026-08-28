"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import type { IconName } from "@/components/ui/Icons";

const FEATURES: { icon: IconName; k: string }[] = [
  { icon: "plan", k: "plan" },
  { icon: "belt", k: "belt" },
  { icon: "streak", k: "streak" },
  { icon: "video", k: "video" },
  { icon: "nutrition", k: "nutrition" },
  { icon: "calorie", k: "calorie" },
  /* "Technique Check" was here, advertising a feature that has been removed.
     A landing page selling something the product no longer does is the same
     class of problem as the "Coming soon" labels on features that shipped. */
  { icon: "clock", k: "circuits" },
  { icon: "users", k: "partners" },
  { icon: "rest", k: "rest" },
];

export function FeaturePreview() {
  const t = useTranslations("features");

  return (
    <section id="features" className="relative border-t border-line/70">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="kicker">{t("kicker")}</p>
            <h2 className="mt-5 font-display text-[clamp(2rem,5vw,3.5rem)] uppercase leading-none">
              {t("titlePre")}
              <span className="text-blood">{t("titleAccent")}</span>
            </h2>
            <p className="mt-5 text-ash">{t("sub")}</p>
          </div>
          <span className="badge shrink-0 border-blood/40 text-blood">
            <Icon name="check" size={13} /> {t("previewBadge")}
          </span>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <article
              key={f.k}
              className={`group relative flex flex-col bg-surface p-7 transition-colors duration-300 hover:bg-surface-2 ${
                i === FEATURES.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
            >
              {/* a hairline of brand colour that arrives on hover */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px scale-x-0 bg-blood transition-transform duration-300 group-hover:scale-x-100"
              />
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-blood/25 bg-blood/10 text-blood transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon name={f.icon} size={24} />
              </span>
              <h3 className="mt-5 font-condensed text-xl font-semibold uppercase tracking-wide">
                {t(`${f.k}_t`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ash">
                {t(`${f.k}_c`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
