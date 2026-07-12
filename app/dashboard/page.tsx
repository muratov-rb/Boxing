import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { RankCard } from "@/components/dashboard/RankCard";
import { CalorieCard } from "@/components/dashboard/CalorieCard";
import { RecoveryCard } from "@/components/dashboard/RecoveryCard";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { SubscriptionSync } from "@/components/dashboard/SubscriptionSync";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/user";

/* emails allowed into /admin — env-extendable, owner by default */
function isAdminEmail(email: string | undefined): boolean {
  const list = (process.env.ADMIN_EMAILS || "smithsonses7@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

export const metadata: Metadata = { title: "Dashboard — RingBornn" };

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();
  const user = await getUser();

  if (configured && !user) redirect("/login?next=/dashboard");

  const t = await getTranslations("dashPage");
  const tt = await getTranslations("train");
  const email = user?.email ?? "fighter@preview";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-void/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LocaleSwitcher />
            <Link
              href="/plans"
              className="hidden font-condensed text-sm uppercase tracking-widest text-ash transition-colors hover:text-bone sm:inline"
            >
              {t("plansLink")}
            </Link>
            {isAdminEmail(user?.email) && (
              <Link
                href="/admin"
                className="hidden font-condensed text-sm uppercase tracking-widest text-blood transition-colors hover:text-blood-bright sm:inline"
              >
                {t("adminLink")}
              </Link>
            )}
            <span className="hidden text-sm text-ash md:block">{email}</span>
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <SubscriptionSync />
        <TrialBanner />
        {!configured && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-blood/40 bg-blood/5 px-4 py-3">
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

        {/* today's workout — the main action */}
        <section className="panel mt-8 flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
          <div>
            <span className="badge border-blood/40 text-blood">
              <Icon name="bolt" size={13} /> {tt("dashBadge")}
            </span>
            <h2 className="mt-4 font-condensed text-2xl font-bold uppercase tracking-wide">
              {tt("dashTitle")}
            </h2>
            <p className="mt-2 max-w-lg text-sm text-ash">{tt("dashCopy")}</p>
          </div>
          <Link href="/train" className="btn btn-primary shine shrink-0">
            {tt("dashCta")}
            <Icon name="arrow" size={18} />
          </Link>
        </section>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* progression */}
          <RankCard />
          <StreakCard />

          {/* lesson library */}
          <section className="panel flex flex-col justify-between p-7">
            <div>
              <span className="badge border-azure/40 text-azure">
                <Icon name="video" size={13} /> {t("lessonsBadge")}
              </span>
              <h2 className="mt-5 font-condensed text-2xl font-bold uppercase tracking-wide">
                {t("lessonsTitle")}
              </h2>
              <p className="mt-2 text-sm text-ash">{t("lessonsCopy")}</p>
            </div>
            <Link href="/lessons" className="btn btn-ghost mt-6">
              {t("lessonsCta")}
              <Icon name="arrow" size={18} />
            </Link>
          </section>

          {/* technique check */}
          <section className="panel flex flex-col justify-between p-7">
            <div>
              <span className="badge border-azure/40 text-azure">
                <Icon name="video" size={13} /> {t("techBadge")}
              </span>
              <h2 className="mt-5 font-condensed text-2xl font-bold uppercase tracking-wide">
                {t("techTitle")}
              </h2>
              <p className="mt-2 text-sm text-ash">{t("techCopy")}</p>
            </div>
            <Link href="/technique" className="btn btn-ghost mt-6">
              {t("techCta")}
              <Icon name="arrow" size={18} />
            </Link>
          </section>

          {/* nutrition */}
          <section className="panel flex flex-col justify-between p-7">
            <div>
              <span className="badge border-blood/40 text-blood">
                <Icon name="nutrition" size={13} /> {t("nutritionBadge")}
              </span>
              <h2 className="mt-5 font-condensed text-2xl font-bold uppercase tracking-wide">
                {t("nutritionTitle")}
              </h2>
              <p className="mt-2 text-sm text-ash">{t("nutritionCopy")}</p>
            </div>
            <Link href="/nutrition" className="btn btn-ghost mt-6">
              {t("nutritionCta")}
              <Icon name="arrow" size={18} />
            </Link>
          </section>

          {/* rest & recovery */}
          <RecoveryCard />

          {/* live tracking */}
          <CalorieCard />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-line/70 pt-5 sm:flex-row">
          <p className="flex items-center gap-2 text-xs text-ash-dim">
            <Icon name="lock" size={12} /> {t("soonNote")}
          </p>
          <Link
            href="/"
            className="font-condensed text-sm uppercase tracking-widest text-ash transition-colors hover:text-bone"
          >
            {t("backHome")}
          </Link>
        </div>
      </main>
    </div>
  );
}
