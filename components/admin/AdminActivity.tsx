"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";

/* The history of what has been done inside the panel — mostly plan changes and
   bans. Bans wipe a person's training history and cannot be undone, so the
   record of who pressed it and when is the only way to reconstruct what
   happened. Loaded on demand, never with the page. */

interface ActivityRow {
  actor: string;
  action: string;
  target_user: string | null;
  detail: Record<string, unknown> | null;
  at: string;
}

/* Actions worth colouring. Everything else reads as ordinary maintenance. */
const DESTRUCTIVE = new Set(["ban"]);

export function AdminActivity() {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (rows) return; // already fetched once
    setError(null);
    try {
      const res = await fetch("/api/admin/activity");
      if (!res.ok) throw new Error();
      const d = (await res.json()) as { activity: ActivityRow[] };
      setRows(d.activity);
    } catch {
      setError(t("activityFailed"));
    }
  };

  return (
    <section className="panel mt-4 overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-bone/[0.03] sm:p-6"
      >
        <span className="flex items-center gap-2.5">
          <span className="text-ash-dim">
            <Icon name="clock" size={16} />
          </span>
          <span className="font-condensed text-sm font-bold uppercase tracking-widest">
            {t("activityTitle")}
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
          {error && <p className="pt-4 text-sm text-blood-bright">{error}</p>}
          {!error && !rows && <p className="pt-4 text-sm text-ash-dim">{t("loading")}</p>}
          {rows?.length === 0 && <p className="pt-4 text-sm text-ash-dim">{t("activityEmpty")}</p>}

          {rows && rows.length > 0 && (
            <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto overscroll-contain">
              {rows.map((r, i) => (
                <li
                  key={`${r.at}-${i}`}
                  className="rounded-xl border border-line/60 px-3.5 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-semibold text-bone">{r.actor}</span>
                    <span
                      className={
                        DESTRUCTIVE.has(r.action)
                          ? "font-condensed text-xs uppercase tracking-wider text-blood"
                          : "font-condensed text-xs uppercase tracking-wider text-ash"
                      }
                    >
                      {r.action}
                    </span>
                    {r.target_user && (
                      <span className="font-mono text-xs text-ash-dim">
                        {r.target_user.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs text-ash-dim">
                    <time dateTime={r.at}>{new Date(r.at).toLocaleString()}</time>
                    {r.detail && Object.keys(r.detail).length > 0 && (
                      <span className="break-all">
                        {Object.entries(r.detail)
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(" · ")}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
