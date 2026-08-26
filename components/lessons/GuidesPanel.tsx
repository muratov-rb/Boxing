"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import type { IconName } from "@/components/ui/Icons";
import { GUIDES, GUIDE_CATS, guidesByCat, type GuideCat } from "@/lib/guides";

/* The reading half of the library, as links.

   The article itself lives at /guides/[id] and is rendered on the server. This
   used to hold its own copy of the reader, which meant the same prose was
   rendered by two components and — more importantly — the only way to read a
   guide was through a client-side switch on /lessons, so no search engine
   could ever see one. Now there is one article, at one URL, and this is a way
   into it. */

const CAT_ICON: Record<GuideCat, IconName> = {
  prep: "target",
  session: "bolt",
  fuel: "nutrition",
  recovery: "rest",
  mind: "belt",
  safety: "lock",
};

export function GuidesPanel() {
  const t = useTranslations("guides");
  const locale = useLocale();
  const li = locale === "ru" ? 1 : 0;
  const [cat, setCat] = useState<GuideCat | "all">("all");

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(["all", ...GUIDE_CATS] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setCat(id)}
            className={`min-h-[40px] rounded-xl border px-3.5 font-condensed text-xs uppercase tracking-wider transition-colors ${
              cat === id
                ? "border-blood bg-blood/10 text-bone"
                : "border-line text-ash hover:border-blood/50"
            }`}
          >
            {id === "all" ? t("all", { n: GUIDES.length }) : t(`cat_${id}`)}
          </button>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {guidesByCat(cat).map((guide) => (
          <li key={guide.id}>
            <Link
              href={`/guides/${guide.id}`}
              className="panel group flex items-start gap-3.5 p-5 transition-colors hover:border-blood/40"
            >
              <span className="mt-0.5 shrink-0 text-blood">
                <Icon name={CAT_ICON[guide.cat]} size={18} />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-xl uppercase leading-none">
                  {guide.title[li]}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-ash">
                  {guide.summary[li]}
                </span>
                <span className="mt-2 block font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                  {t(`cat_${guide.cat}`)} · {t("readMins", { n: guide.readMins })}
                </span>
              </span>
              <span className="ml-auto shrink-0 self-center text-ash-dim transition-transform group-hover:translate-x-0.5 group-hover:text-blood">
                <Icon name="arrow" size={16} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
