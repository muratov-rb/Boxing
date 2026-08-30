"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { priceLabel, TRIAL_DAYS, type PaidPlanId } from "@/lib/subscription";
import {
  isPaid,
  summarise,
  revenueByTier,
  signupsByMonth,
  toCsv,
  type UserRow,
  trialConversion,
} from "@/lib/admin-stats";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { Icon } from "@/components/ui/Icons";
import { AdminActivity } from "./AdminActivity";
import { AdminCohorts } from "@/components/admin/AdminCohorts";
import { AdminTickets } from "./AdminTickets";

/* ===========================================================================
   Admin panel. The admin signs in with a fixed name/password rather than an
   account, so the rows are read on the server (page.tsx) and handed down as a
   prop; edits POST to /api/admin/user and then ask the server to re-render.
   The service-role key stays server-side throughout.
   =========================================================================== */

const PLAN_OPTIONS = ["trial", "budget", "pro", "max", "expired"] as const;
const PERIOD_OPTIONS = ["monthly", "yearly"] as const;

const trialDayOf = (start: string): number => {
  const ms = Date.now() - new Date(`${start}T00:00:00`).getTime();
  return Math.max(1, Math.floor(ms / 86_400_000) + 1);
};

/* --------------------------------- charts -------------------------------- */

function BarChart({
  title,
  data,
  format,
}: {
  title: string;
  data: { label: string; value: number }[];
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="panel p-5">
      <h3 className="font-condensed text-xs font-bold uppercase tracking-widest text-ash">
        {title}
      </h3>
      <div className="mt-4 space-y-3">
        {data.map((d) => (
          <div key={d.label}>
            {/* label and figure on one line, bar beneath: at this width the
                three-column version squeezed the bar into almost nothing */}
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-condensed text-[0.7rem] uppercase tracking-wider text-ash-dim">
                {d.label}
              </span>
              <span className="font-condensed text-xs tabular-nums text-bone">
                {format ? format(d.value) : d.value}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--admin-line)]">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${
                  d.value === 0 ? "bg-transparent" : "bg-blood"
                }`}
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- panel --------------------------------- */

export function AdminClient({
  users: rows,
  problem = "none",
  detail,
  me,
}: {
  users: UserRow[];
  problem?: "none" | "no_key" | "no_url" | "wrong_key" | "query_failed";
  detail?: string;
  me: { username: string; role: "owner" };
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (userId: string, body: Record<string, unknown>) => {
    setSavingId(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, ...body }),
      });
      if (!res.ok) throw new Error("failed");
      // the list lives on the server; ask it to send a fresh one
      startRefresh(() => router.refresh());
    } catch {
      setError(t("saveFailed"));
    } finally {
      setSavingId(null);
    }
  };

  const banUser = (r: UserRow) => {
    /* destructive and irreversible — make them read what happens first */
    const ok = window.confirm(
      t("banConfirm", { email: r.email ?? r.user_id.slice(0, 8) }),
    );
    if (ok) act(r.user_id, { action: "ban" });
  };

  const signOut = async () => {
    await fetch("/api/admin-login", { method: "DELETE" });
    window.location.reload();
  };

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const matchesText = (r.email ?? "")
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        const matchesPlan =
          planFilter === "all" ||
          (planFilter === "banned" ? r.banned : r.plan === planFilter && !r.banned);
        return matchesText && matchesPlan;
      }),
    [rows, query, planFilter],
  );

  const stats = useMemo(() => summarise(rows), [rows]);
  const conv = useMemo(() => trialConversion(rows, TRIAL_DAYS), [rows]);

  const revenueBars = useMemo(() => {
    const tiers = revenueByTier(rows);
    return (["budget", "pro", "max"] as PaidPlanId[]).map((id) => ({
      label: t(`plan_${id}`),
      value: tiers[id],
    }));
  }, [rows, t]);

  const signups = useMemo(() => signupsByMonth(rows), [rows]);

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ringbornn-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-shell flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-[var(--admin-line)] bg-[var(--admin-surface)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle />
            <LocaleSwitcher />
            <span className="hidden font-condensed text-xs uppercase tracking-widest text-ash-dim sm:inline">
              {me.username}
              <span className="ml-1.5 text-blood">{t("roleOwner")}</span>
            </span>
            <button
              type="button"
              onClick={signOut}
              className="font-condensed text-xs uppercase tracking-widest text-ash transition-colors hover:text-blood sm:text-sm"
            >
              {t("signOut")}
            </button>
            <Link
              href="/dashboard"
              aria-label={t("backDash")}
              className="flex items-center font-condensed text-xs uppercase tracking-widest text-ash transition-colors hover:text-bone sm:text-sm"
            >
              {/* the words don't fit next to everything else on a phone */}
              <span className="hidden sm:inline">{t("backDash")}</span>
              <span className="sm:hidden">
                <Icon name="home" size={18} />
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
          {t("titlePre")}
          <span className="text-blood">{t("titleAccent")}</span>
          {refreshing && (
            <span className="ml-3 align-middle font-condensed text-xs uppercase tracking-[0.25em] text-ash-dim">
              {t("loading")}
            </span>
          )}
        </h1>

        {problem !== "none" && (
          <div className="panel mt-8 p-7">
            <div className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-blood/40 text-blood">
                <Icon name="lock" size={22} />
              </div>
              <div className="min-w-0">
                <p className="font-condensed text-sm font-bold uppercase tracking-widest text-blood">
                  {t(`problem_${problem}_title`)}
                </p>
                <p className="mt-2 leading-relaxed text-ash">
                  {t(`problem_${problem}`)}
                </p>
                {detail && (
                  <p className="mt-3 break-words rounded-lg border border-line bg-void/70 p-3 font-mono text-xs text-ash-dim">
                    {detail}
                  </p>
                )}
                <p className="mt-4 text-xs text-ash-dim">{t("problemRedeploy")}</p>
              </div>
            </div>
          </div>
        )}

        {problem === "none" && (
          <>
            {/* headline numbers */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {(
                [
                  ["statTotal", stats.total],
                  ["statPaying", stats.paying],
                  ["statTrial", stats.trial],
                  ["statExpired", stats.expired],
                  ["statBanned", stats.banned],
                  ["statActive30", stats.active30],
                ] as const
              ).map(([key, value]) => (
                <div
                  key={key}
                  className={`panel p-4 ${value === 0 ? "admin-stat-zero" : ""}`}
                >
                  <p className="font-display text-3xl leading-none tabular-nums">{value}</p>
                  <p className="mt-1 font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                    {t(key)}
                  </p>
                </div>
              ))}
            </div>

            {/* revenue */}
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <div className="panel admin-headline p-5">
                <p className="font-condensed text-xs font-bold uppercase tracking-widest text-ash">
                  {t("mrr")}
                </p>
                <p className="mt-2 font-display text-4xl leading-none text-blood">
                  {priceLabel(stats.mrr)}
                </p>
                <p className="mt-1 text-xs text-ash-dim">
                  {t("arrLine", { amount: priceLabel(stats.arr) })}
                </p>
              </div>
              <div className="panel admin-headline p-5">
                <p className="font-condensed text-xs font-bold uppercase tracking-widest text-ash">
                  {t("conversionTitle")}
                </p>
                <p className="mt-2 font-display text-4xl leading-none text-blood">
                  {conv.pct === null ? "—" : `${conv.pct}%`}
                </p>
                <p className="mt-1 text-xs text-ash-dim">
                  {conv.pct === null
                    ? t("conversionNone")
                    : t("conversionLine", { converted: conv.converted, ended: conv.ended })}
                </p>
                {conv.running > 0 && (
                  <p className="mt-0.5 text-xs text-ash-dim">
                    {t("conversionRunning", { n: conv.running })}
                  </p>
                )}
              </div>
              <BarChart
                title={t("chartRevenueTier")}
                data={revenueBars}
                format={(n) => priceLabel(n)}
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <BarChart
                title={t("chartPlanMix")}
                data={[
                  { label: t("plan_trial"), value: stats.trial },
                  { label: t("plan_budget"), value: stats.budget },
                  { label: t("plan_pro"), value: stats.pro },
                  { label: t("plan_max"), value: stats.max },
                  { label: t("plan_expired"), value: stats.expired },
                ]}
              />
              <BarChart
                title={t("chartSignups")}
                data={signups.length ? signups : [{ label: "—", value: 0 }]}
              />
            </div>

            {/* controls */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search")}
                className="w-full min-w-0 rounded-xl border border-line bg-void/70 px-4 py-2.5 text-base text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none sm:w-auto sm:flex-1 sm:text-sm"
              />
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="rounded-lg border border-line bg-void px-3 py-2.5 font-condensed text-xs uppercase tracking-wider text-bone focus:border-blood focus:outline-none"
              >
                <option value="all">{t("filterAll")}</option>
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {t(`plan_${p}`)}
                  </option>
                ))}
                <option value="banned">{t("statBanned")}</option>
              </select>
              <button type="button" onClick={exportCsv} className="btn btn-ghost !px-4 !py-2.5 text-xs">
                {t("exportCsv")}
              </button>
            </div>

            {error && <p className="mt-3 text-sm text-blood-bright">{error}</p>}

            {/* users */}
            <div className="mt-4 space-y-2">
              {filtered.length === 0 && (
                <div className="panel p-7 text-center text-sm text-ash">{t("empty")}</div>
              )}
              {filtered.map((r) => (
                <div
                  key={r.user_id}
                  className={`panel flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-4 ${
                    r.banned ? "border-blood/50 opacity-70" : ""
                  }`}
                >
                  <div className="min-w-0 lg:flex-1">
                    <p className="truncate text-sm text-bone">
                      {r.email ?? r.user_id.slice(0, 8)}
                      {r.banned && (
                        <span className="ml-2 align-middle font-condensed text-[0.6rem] uppercase tracking-wider text-blood">
                          {t("statBanned")}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-ash-dim">
                      {r.plan === "trial"
                        ? t("trialDay", { n: Math.min(7, trialDayOf(r.trial_start)) })
                        : t("since", { date: new Date(r.updated_at).toLocaleDateString() })}
                      {r.last_active && ` · ${t("lastActive", { date: r.last_active })}`}
                    </p>
                  </div>

                  {/* Two per row on a phone, one line on a laptop. Wrapping five
                      controls freely produced an unreadable pile at 375px. */}
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                    <select
                      value={r.plan}
                      disabled={savingId === r.user_id || r.banned}
                      onChange={(e) =>
                        act(r.user_id, {
                          action: "setPlan",
                          plan: e.target.value,
                          period: r.period ?? "monthly",
                        })
                      }
                      className="w-full rounded-lg border border-line bg-void px-3 py-3 font-condensed text-xs uppercase tracking-wider text-bone focus:border-blood focus:outline-none disabled:opacity-40 sm:w-auto sm:py-2"
                    >
                      {PLAN_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {t(`plan_${p}`)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={r.period ?? "monthly"}
                      disabled={savingId === r.user_id || !isPaid(r.plan) || r.banned}
                      onChange={(e) =>
                        act(r.user_id, {
                          action: "setPlan",
                          plan: r.plan,
                          period: e.target.value,
                        })
                      }
                      title={t("periodLabel")}
                      className="w-full rounded-lg border border-line bg-void px-3 py-3 font-condensed text-xs uppercase tracking-wider text-bone focus:border-blood focus:outline-none disabled:opacity-40 sm:w-auto sm:py-2"
                    >
                      {PERIOD_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {t(`period_${p}`)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={savingId === r.user_id || r.banned}
                      onClick={() => act(r.user_id, { action: "restartTrial" })}
                      className="btn btn-ghost w-full !px-3 !py-3 text-xs sm:w-auto sm:!py-2"
                    >
                      {t("restartTrial")}
                    </button>

                    {r.banned ? (
                      <button
                        type="button"
                        disabled={savingId === r.user_id}
                        onClick={() => act(r.user_id, { action: "unban" })}
                        className="btn btn-ghost w-full !px-3 !py-3 text-xs sm:w-auto sm:!py-2"
                      >
                        {t("unban")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={savingId === r.user_id}
                        onClick={() => banUser(r)}
                        className="w-full rounded-xl border border-blood/50 px-3 py-3 font-condensed text-xs uppercase tracking-wider text-blood transition-colors hover:bg-blood hover:text-white sm:w-auto sm:py-2"
                      >
                        {t("ban")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-ash-dim">{t("note")}</p>

            <AdminCohorts />
        <AdminTickets />
            <AdminActivity />
          </>
        )}
      </main>
    </div>
  );
}
