import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { RANKS } from "@/lib/onboarding";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Dashboard — Pressure" };

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();
  const user = await getUser();

  if (configured && !user) redirect("/login?next=/dashboard");

  const t = await getTranslations("dashPage");
  const tr = await getTranslations("ranks");
  const email = user?.email ?? "fighter@preview";
  const rank0 = tr("0n");
  const comingItems = [t("f1"), t("f2"), t("f3"), t("f4")];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-void/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LocaleSwitcher />
            <span className="hidden text-sm text-ash sm:block">{email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="font-condensed text-sm uppercase tracking-widest text-ash transition-colors hover:text-bone"
              >
                {t("signOut")}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {!configured && (
          <div className="mb-6 flex items-center gap-3 border border-blood/40 bg-blood/5 px-4 py-3">
            <span className="text-blood">
              <Icon name="lock" size={18} />
            </span>
            <p className="text-sm text-ash">
              <span className="font-semibold text-bone">{t("previewBold")}</span>{" "}
              {t("previewRest")}
            </p>
          </div>
        )}

        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
          {t("welcomePre")}
          <span className="text-blood">{t("welcomeAccent")}</span>
        </h1>
        <p className="mt-2 text-ash">{t("sub")}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <section className="panel p-7">
            <span className="badge border-blood/40 text-blood">
              <Icon name="belt" size={13} />{" "}
              {t("rankBadge", { rank: rank0, total: RANKS.length })}
            </span>
            <h2 className="mt-5 font-condensed text-2xl font-bold uppercase tracking-wide">
              {t("noPlan")}
            </h2>
            <p className="mt-2 text-sm text-ash">{t("noPlanCopy")}</p>
            <Link href="/onboarding" className="btn btn-primary shine mt-6">
              {t("buildPlan")}
              <Icon name="arrow" size={18} />
            </Link>
          </section>

          <section className="panel flex flex-col justify-between p-7">
            <div>
              <h2 className="font-condensed text-2xl font-bold uppercase tracking-wide">
                {t("comingSoon")}
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-ash">
                {comingItems.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <span className="text-ash-dim">
                      <Icon name="lock" size={14} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/" className="btn btn-ghost mt-6">
              {t("backHome")}
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
