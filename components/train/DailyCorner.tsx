"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motivationForDay, type MotivationItem } from "@/lib/motivation";
import { rankProgress } from "@/lib/tracking";
import { Icon } from "@/components/ui/Icons";

/* Three lines before the session: one to get you going, one on how to train,
   one on how to fight. They come from a written library rather than a model,
   so they cost nothing, appear with the page, and say something specific to
   the rank you actually hold.

   Deliberately not gated. Somebody on the cheapest plan needs a reason to
   turn up as much as anyone else does — arguably more. */

const ICON: Record<MotivationItem["kind"], "bolt" | "target" | "gloves"> = {
  motivation: "bolt",
  advice: "target",
  tactic: "gloves",
};

const TONE: Record<MotivationItem["kind"], string> = {
  motivation: "text-blood",
  advice: "text-azure",
  tactic: "text-ember",
};

export function DailyCorner({ className = "" }: { className?: string }) {
  const t = useTranslations("corner");
  const locale = useLocale() === "ru" ? "ru" : "en";
  /* The rank lives in local storage, so it can only be read after mount.
     Rendering nothing first pass keeps the server and client markup identical
     rather than flashing the Novice lines at everybody. */
  const [items, setItems] = useState<MotivationItem[] | null>(null);

  useEffect(() => {
    setItems(motivationForDay(rankProgress().rankIndex));
  }, []);

  if (!items?.length) return null;

  return (
    <section className={`panel p-6 ${className}`}>
      <div className="flex items-center gap-2.5">
        <span className="text-blood">
          <Icon name="belt" size={16} />
        </span>
        <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
          {t("title")}
        </h2>
      </div>

      <ul className="mt-5 space-y-4">
        {items.map((item) => (
          <li key={item.kind} className="flex items-start gap-3">
            <span className={`mt-0.5 shrink-0 ${TONE[item.kind]}`}>
              <Icon name={ICON[item.kind]} size={15} />
            </span>
            <div className="min-w-0">
              <p
                className={`font-condensed text-[0.65rem] uppercase tracking-widest ${TONE[item.kind]}`}
              >
                {t(`kind_${item.kind}`)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-bone/90">
                {item.text[locale]}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs text-ash-dim">{t("note")}</p>
    </section>
  );
}
