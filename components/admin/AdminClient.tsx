"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PRICES, priceLabel, type PaidPlanId } from "@/lib/subscription";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { Icon } from "@/components/ui/Icons";

/* ===========================================================================
   AdminClient — subscription control panel.
   Authorization is enforced by Supabase RLS: the `is_admin()` check runs on
   every query, so a non-admin sees an access-denied state here and couldn't
   read the data anyway. Admins can change any user's plan; the change reaches
   the user's app through SubscriptionSync on their next visit.
   =========================================================================== */

interface SubRow {
  user_id: string;
  email: string | null;
  plan: string;
  trial_start: string;
  updated_at: string;
}

const PLAN_OPTIONS = ["trial", "budget", "pro", "max", "expired"] as const;

const trialDayOf = (start: string): number => {
  const ms = Date.now() - new Date(`${start}T00:00:00`).getTime();
  return Math.max(1, Math.floor(ms / 86_400_000) + 1);
};

export function AdminClient() {
  const t = useTranslations("admin");
  const [state, setState] = useState<"loading" | "denied" | "unconfigured" | "ready">(
    "loading",
  );
  const [rows, setRows] = useState<SubRow[]>([]);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState("unconfigured");
      return;
    }
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: isAdmin, error: rpcErr } = await supabase.rpc("is_admin");
        if (rpcErr || !isAdmin) {
          setState("denied");
          return;
        }
        const { data, error: qErr } = await supabase
          .from("subscriptions")
          .select("user_id, email, plan, trial_start, updated_at")
          .order("updated_at", { ascending: false });
        if (qErr) throw qErr;
        setRows(data ?? []);
        setState("ready");
      } catch {
        setState("denied");
      }
    };
    load();
  }, []);

  const setPlanFor = async (userId: string, plan: string) => {
    setSavingId(userId);
    setError(null);
    try {
      const supabase = createClient();
      const { error: uErr } = await supabase
        .from("subscriptions")
        .update({ plan, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (uErr) throw uErr;
      setRows((rs) => rs.map((r) => (r.user_id === userId ? { ...r, plan } : r)));
    } catch {
      setError(t("saveFailed"));
    } finally {
      setSavingId(null);
    }
  };

  const restartTrial = async (userId: string) => {
    setSavingId(userId);
    setError(null);
    try {
      const supabase = createClient();
      const today = new Date().toISOString().slice(0, 10);
      const { error: uErr } = await supabase
        .from("subscriptions")
        .update({ plan: "trial", trial_start: today, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (uErr) throw uErr;
      setRows((rs) =>
        rs.map((r) =>
          r.user_id === userId ? { ...r, plan: "trial", trial_start: today } : r,
        ),
      );
    } catch {
      setError(t("saveFailed"));
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        (r.email ?? "").toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [rows, query],
  );

  const stats = useMemo(() => {
    const by = (p: string) => rows.filter((r) => r.plan === p).length;
    const mrr = rows.reduce(
      (s, r) =>
        s + (r.plan === "budget" || r.plan === "pro" || r.plan === "max"
          ? PRICES[r.plan as PaidPlanId]
          : 0),
      0,
    );
    return { total: rows.length, trial: by("trial"), budget: by("budget"), pro: by("pro"), max: by("max"), expired: by("expired"), mrr };
  }, [rows]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-void/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LocaleSwitcher />
            <Link
              href="/dashboard"
              className="font-condensed text-sm uppercase tracking-widest text-ash transition-colors hover:text-bone"
            >
              {t("backDash")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
          {t("titlePre")}
          <span className="text-blood">{t("titleAccent")}</span>
        </h1>

        {state === "loading" && (
          <div className="panel mt-8 p-10 text-center">
            <div className="animate-glow mx-auto grid h-14 w-14 place-items-center rounded-full text-blood">
              <Icon name="bolt" size={28} />
            </div>
            <p className="mt-4 font-condensed text-sm uppercase tracking-[0.25em] text-ash">
              {t("loading")}
            </p>
          </div>
        )}

        {state === "unconfigured" && (
          <div className="panel mt-8 p-7">
            <p className="text-ash">{t("unconfigured")}</p>
          </div>
        )}

        {state === "denied" && (
          <div className="panel mt-8 p-7 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-blood/40 text-blood">
              <Icon name="lock" size={26} />
            </div>
            <p className="mt-4 text-ash">{t("denied")}</p>
            <Link href="/dashboard" className="btn btn-ghost mt-5">
              {t("backDash")}
            </Link>
          </div>
        )}

        {state === "ready" && (
          <>
            {/* stats */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {(
                [
                  ["statTotal", stats.total],
                  ["statTrial", stats.trial],
                  ["statBudget", stats.budget],
                  ["statPro", stats.pro],
                  ["statMax", stats.max],
                  ["statExpired", stats.expired],
                ] as const
              ).map(([key, n]) => (
                <div key={key} className="panel p-4 text-center">
                  <p className="font-display text-3xl leading-none">{n}</p>
                  <p className="mt-1.5 font-condensed text-[0.62rem] uppercase tracking-widest text-ash-dim">
                    {t(key)}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-ash">
              {t("mrr")}: <span className="font-condensed font-bold text-bone">{priceLabel(stats.mrr)}</span>
              <span className="text-ash-dim"> / {t("perMonth")}</span>
            </p>

            {/* search */}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className="mt-6 w-full rounded-xl border border-line bg-void px-4 py-3 text-sm text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none sm:max-w-sm"
            />

            {error && <p className="mt-3 text-sm text-blood-bright">{error}</p>}

            {/* users */}
            <div className="mt-4 space-y-2">
              {filtered.length === 0 && (
                <p className="panel p-6 text-sm text-ash">{t("empty")}</p>
              )}
              {filtered.map((r) => (
                <div
                  key={r.user_id}
                  className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-bone">
                      {r.email ?? r.user_id.slice(0, 8)}
                    </p>
                    <p className="mt-0.5 text-xs text-ash-dim">
                      {r.plan === "trial"
                        ? t("trialDay", { n: Math.min(7, trialDayOf(r.trial_start)) })
                        : t("since", { date: new Date(r.updated_at).toLocaleDateString() })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      value={r.plan}
                      disabled={savingId === r.user_id}
                      onChange={(e) => setPlanFor(r.user_id, e.target.value)}
                      className="rounded-lg border border-line bg-void px-3 py-2 font-condensed text-xs uppercase tracking-wider text-bone focus:border-blood focus:outline-none"
                    >
                      {PLAN_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {t(`plan_${p}`)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={savingId === r.user_id}
                      onClick={() => restartTrial(r.user_id)}
                      className="btn btn-ghost !px-3 !py-2 text-xs"
                    >
                      {t("restartTrial")}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-ash-dim">{t("note")}</p>
          </>
        )}
      </main>
    </div>
  );
}
