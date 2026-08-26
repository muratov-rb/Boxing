"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import type { IconName } from "@/components/ui/Icons";
import { GUIDES, GUIDE_CATS, guidesByCat, type Guide, type GuideCat } from "@/lib/guides";

/* The reading half of the library.

   Everything else in this app is a movement or a timer. These are the answers
   a corner gives that are not "throw the jab" — fight week, breathing, what to
   eat, when to stop. Text, because that is the right shape for advice. */

const CAT_ICON: Record<GuideCat, IconName> = {
  prep: "target",
  session: "bolt",
  fuel: "nutrition",
  recovery: "rest",
  mind: "belt",
  safety: "lock",
};

/** `initialId` opens straight to one guide. Exists so a guide can be linked to
    directly, and so the reader view can be exercised without a click. */
export function GuidesPanel({ initialId }: { initialId?: string } = {}) {
  const t = useTranslations("guides");
  const locale = useLocale();
  const li = locale === "ru" ? 1 : 0;

  const [cat, setCat] = useState<GuideCat | "all">("all");
  const [open, setOpen] = useState<Guide | null>(
    initialId ? (GUIDES.find((x) => x.id === initialId) ?? null) : null,
  );

  if (open) {
    return (
      <article className="mx-auto w-full max-w-2xl">
        <button
          type="button"
          onClick={() => setOpen(null)}
          className="mb-5 inline-flex items-center gap-2 font-condensed text-xs uppercase tracking-widest text-ash transition-colors hover:text-bone"
        >
          <span className="rotate-180">
            <Icon name="arrow" size={14} />
          </span>
          {t("back")}
        </button>

        <p className="kicker">{t(`cat_${open.cat}`)}</p>
        <h2 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.75rem)] uppercase leading-none">
          {open.title[li]}
        </h2>
        <p className="mt-3 leading-relaxed text-ash">{open.summary[li]}</p>
        <p className="mt-2 font-condensed text-xs uppercase tracking-widest text-ash-dim">
          {t("readMins", { n: open.readMins })}
        </p>

        <div className="mt-8 space-y-8">
          {open.sections.map((s) => (
            <section key={s.heading[0]}>
              <h3 className="font-condensed text-lg font-bold uppercase tracking-wide text-bone">
                {s.heading[li]}
              </h3>
              <div className="mt-3 space-y-3">
                {s.body.map((block, i) =>
                  Array.isArray(block[0]) ? (
                    <ul key={i} className="space-y-2.5">
                      {(block as [string, string][]).map((item) => (
                        <li key={item[0]} className="flex gap-3 leading-relaxed text-ash">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blood" />
                          <span>{item[li]}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i} className="leading-relaxed text-ash">
                      {(block as [string, string])[li]}
                    </p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </article>
    );
  }

  const list = guidesByCat(cat);

  return (
    <div>
      {/* category filter */}
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
        {list.map((guide) => (
          <li key={guide.id}>
            <button
              type="button"
              onClick={() => setOpen(guide)}
              className="panel group w-full p-5 text-left transition-colors hover:border-blood/40"
            >
              <div className="flex items-start gap-3.5">
                <span className="mt-0.5 shrink-0 text-blood">
                  <Icon name={CAT_ICON[guide.cat]} size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-xl uppercase leading-none">
                    {guide.title[li]}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ash">{guide.summary[li]}</p>
                  <p className="mt-2 font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                    {t(`cat_${guide.cat}`)} · {t("readMins", { n: guide.readMins })}
                  </p>
                </div>
                <span className="ml-auto shrink-0 self-center text-ash-dim transition-transform group-hover:translate-x-0.5 group-hover:text-blood">
                  <Icon name="arrow" size={16} />
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
