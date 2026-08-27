import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icon } from "@/components/ui/Icons";
import type { IconName } from "@/components/ui/Icons";
import { GUIDES, type GuideCat } from "@/lib/guides";
import { SERVICE } from "@/lib/legal";

/* The guides as real pages, not a tab.

   They already existed inside /lessons, where a search engine could never
   reach them: one URL, content behind a client-side switch. Ten articles
   answering questions people actually type — how to breathe when boxing, what
   to do the week of a fight, when not to train after a head knock — are the
   most searchable thing this project has, and they were invisible.

   Public and server-rendered. Gating them would defeat the entire purpose. */

export const metadata: Metadata = {
  title: `Boxing Guides — ${SERVICE}`,
  description:
    "Straight answers on training, fight week, breathing, nutrition, recovery and when not to train. Written for beginners and fighters alike.",
  alternates: { canonical: "/guides" },
};

const CAT_ICON: Record<GuideCat, IconName> = {
  prep: "target",
  session: "bolt",
  fuel: "nutrition",
  recovery: "rest",
  mind: "belt",
  safety: "lock",
};

export default async function GuidesIndex() {
  const t = await getTranslations("guides");
  const li = (await getLocale()) === "ru" ? 1 : 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-void/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="font-condensed text-xs uppercase tracking-widest text-ash transition-colors hover:text-bone sm:text-sm"
            >
              {t("home")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.25rem)] uppercase leading-none">
          {t("indexTitlePre")}
          <span className="text-blood">{t("indexTitleAccent")}</span>
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ash">{t("indexSub")}</p>

        <ul className="mt-10 space-y-3">
          {GUIDES.map((guide) => (
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
      </main>
    </div>
  );
}
