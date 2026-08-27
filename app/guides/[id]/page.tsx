import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icon } from "@/components/ui/Icons";
import { GUIDES, guideById } from "@/lib/guides";
import { SERVICE, SITE_URL } from "@/lib/legal";

/* One guide, one URL, rendered on the server.

   Server-rendered rather than a client tab because the whole point is that a
   crawler — and a person arriving from a search result — gets the full article
   in the first response, with no JavaScript required to read it. */

export function generateStaticParams() {
  return GUIDES.map((g) => ({ id: g.id }));
}

/* MEASURED, so nobody re-tests it: an unknown id serves the not-found UI with
   a 200, not a 404. dynamicParams has no effect here because the page reads
   the locale cookie and is therefore rendered per request rather than
   pre-generated, so there is no static set for Next to enforce against.

   Left as-is deliberately. Forcing a real 404 means checking the id in the
   proxy, which runs on every request to every page — measurable cost on all
   traffic to fix URLs nothing links to and the sitemap does not list. If a
   typo'd guide URL ever does get shared, revisit it then. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const guide = guideById(id);
  if (!guide) return { title: `Guide — ${SERVICE}` };

  const li = (await getLocale()) === "ru" ? 1 : 0;
  const title = `${guide.title[li]} — ${SERVICE}`;
  return {
    title,
    description: guide.summary[li],
    alternates: { canonical: `/guides/${guide.id}` },
    openGraph: {
      type: "article",
      title,
      description: guide.summary[li],
      url: `${SITE_URL}/guides/${guide.id}`,
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const guide = guideById(id);
  if (!guide) notFound();

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
              href="/guides"
              className="font-condensed text-xs uppercase tracking-widest text-ash transition-colors hover:text-bone sm:text-sm"
            >
              {t("back")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <article>
          <p className="kicker">{t(`cat_${guide.cat}`)}</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,5.5vw,3rem)] uppercase leading-none">
            {guide.title[li]}
          </h1>
          <p className="mt-4 leading-relaxed text-ash">{guide.summary[li]}</p>
          <p className="mt-2 font-condensed text-xs uppercase tracking-widest text-ash-dim">
            {t("readMins", { n: guide.readMins })}
          </p>

          {/* The answer before the article — most readers stop here. */}
          <section className="mt-7 rounded-xl border border-blood/40 bg-blood/5 p-5">
            <h2 className="font-condensed text-xs uppercase tracking-widest text-blood">
              {t("shortVersion")}
            </h2>
            <ul className="mt-3 space-y-2.5">
              {guide.keyPoints.map((p) => (
                <li key={p[0]} className="flex gap-3 leading-relaxed text-bone">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blood" />
                  <span>{p[li]}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 space-y-8">
            {guide.sections.map((s) => (
              <section key={s.heading[0]}>
                <h2 className="font-condensed text-lg font-bold uppercase tracking-wide text-bone">
                  {s.heading[li]}
                </h2>
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

          {guide.evidence && (
            <p className="mt-10 border-t border-line/70 pt-5 text-xs leading-relaxed text-ash-dim">
              {guide.evidence[li]}
            </p>
          )}
        </article>

        {/* Somewhere to go next, for both readers and crawlers. */}
        <nav className="mt-12 border-t border-line/70 pt-6">
          <p className="font-condensed text-xs uppercase tracking-widest text-ash">
            {t("moreGuides")}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {GUIDES.filter((x) => x.id !== guide.id)
              .slice(0, 4)
              .map((x) => (
                <li key={x.id}>
                  <Link
                    href={`/guides/${x.id}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:border-blood/50"
                  >
                    <span className="text-sm text-bone">{x.title[li]}</span>
                    <span className="shrink-0 text-ash-dim transition-transform group-hover:translate-x-0.5 group-hover:text-blood">
                      <Icon name="arrow" size={14} />
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
          <Link
            href="/guides"
            className="mt-4 inline-flex items-center gap-2 font-condensed text-xs uppercase tracking-widest text-blood hover:opacity-70"
          >
            {t("allGuides")} <Icon name="arrow" size={14} />
          </Link>
        </nav>
      </main>
    </div>
  );
}
