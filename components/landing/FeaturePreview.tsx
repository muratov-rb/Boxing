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
  { icon: "technique", k: "technique" },
  { icon: "rest", k: "rest" },
];

export function FeaturePreview() {
  const t = useTranslations("features");

  return (
    <section id="features" className="relative border-t border-line/70">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
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
            <Icon name="lock" size={13} /> {t("previewBadge")}
          </span>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <article
              key={f.k}
              className="group relative flex flex-col bg-surface p-6 transition-colors duration-300 hover:bg-surface-2"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-line text-blood transition-transform duration-300 group-hover:-translate-y-0.5">
                <Icon name={f.icon} size={24} />
              </span>
              <h3 className="mt-5 font-condensed text-xl font-semibold uppercase tracking-wide">
                {t(`${f.k}_t`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ash">
                {t(`${f.k}_c`)}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 font-condensed text-[0.65rem] uppercase tracking-[0.2em] text-ash-dim">
                <Icon name="lock" size={11} /> {t("comingSoon")}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
