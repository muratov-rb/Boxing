"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import type { CohortRow } from "@/lib/admin-stats";

/* Retention, one row per signup week.

   Its own section, loaded on demand: the query behind it reads every training
   day for every account, and nothing else on the panel should wait on that.
   If it fails it says so and the rest of the dashboard is untouched. */

/** Green when they came back, red when they did not. Kept blunt on purpose --
    a colour you have to interpret is worse than a number on its own. */
function cellStyle(pct: number | null): string {
  if (pct === null) return "bg-void/40 text-ash-dim";
  if (pct >= 60) return "bg-emerald-500/20 text-emerald-300";
  if (pct >= 35) return "bg-amber-500/20 text-amber-300";
  if (pct > 0) return "bg-blood/20 text-blood-bright";
  return "bg-void/60 text-ash-dim";
}

export function AdminCohorts() {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CohortRow[] | null>(null);
  const [weeks, setWeeks] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/cohorts");
      if (!res.ok) throw new Error();
      const d = (await res.json()) as { cohorts: CohortRow[]; weeks: number };
      setRows(d.cohorts ?? []);
      setWeeks(d.weeks ?? 5);
    } catch {
      setError(t("cohortsFailed"));
    } finally {
      setLoaded(true);
    }
  }, [t]);

  /* Fetched the first time it is opened, not on mount. */
  useEffect(() => {
    if (open && !loaded) void load();
  }, [open, loaded, load]);

  return (
    <section className="panel mt-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-bone/[0.03] sm:p-6"
      >
        <span className="flex items-center gap-2.5">
          <span className="text-ash-dim">
            <Icon name="streak" size={16} />
          </span>
          <span className="font-condensed text-sm font-bold uppercase tracking-widest">
            {t("cohortsTitle")}
          </span>
        </span>
        <span
          className={`text-ash-dim transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <Icon name="chevron" size={16} />
        </span>
      </button>

      {open && (
        <div className="border-t border-line/70 px-5 pb-5 sm:px-6 sm:pb-6">
          <p className="pt-4 text-sm leading-relaxed text-ash">{t("cohortsHelp")}</p>

          {error && <p className="mt-4 text-sm text-blood-bright">{error}</p>}
          {!error && !loaded && <p className="mt-4 text-sm text-ash-dim">{t("loading")}</p>}
          {loaded && !error && rows?.length === 0 && (
            <p className="mt-4 text-sm text-ash-dim">{t("cohortsEmpty")}</p>
          )}

          {rows && rows.length > 0 && (
            /* The table scrolls inside itself; the page must never scroll
               sideways because of it. */
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2 pr-3 font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                      {t("cohortWeek")}
                    </th>
                    <th className="pb-2 pr-3 font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                      {t("cohortSize")}
                    </th>
                    {Array.from({ length: weeks }, (_, i) => (
                      <th
                        key={i}
                        className="pb-2 pr-1 text-center font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim"
                      >
                        {t("cohortWeekN", { n: i })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.week}>
                      <td className="whitespace-nowrap py-1 pr-3 font-mono text-xs text-bone">
                        {r.week}
                      </td>
                      <td className="py-1 pr-3 text-xs text-ash">{r.size}</td>
                      {r.weeks.map((pct, i) => (
                        <td key={i} className="py-1 pr-1">
                          <span
                            className={`block rounded px-2 py-1.5 text-center text-xs font-semibold ${cellStyle(pct)}`}
                          >
                            {pct === null ? "—" : `${pct}%`}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
