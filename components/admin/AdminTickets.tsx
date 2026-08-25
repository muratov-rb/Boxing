"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import type { SupportStatus } from "@/lib/support";

/* What people have written in.

   Unlike the activity log this loads with the page rather than on demand: the
   whole point is to notice an unanswered ticket without being told to look, so
   the unread count has to be visible while the panel is still collapsed. */

interface Ticket {
  id: number;
  user_id: string | null;
  email: string;
  topic: string;
  message: string;
  page: string | null;
  status: SupportStatus;
  created_at: string;
}

const NEXT_STATUS: Record<SupportStatus, SupportStatus> = {
  new: "open",
  open: "done",
  done: "new",
};

export function AdminTickets() {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/tickets");
      if (!res.ok) throw new Error();
      const d = (await res.json()) as { tickets: Ticket[] };
      setRows(d.tickets);
    } catch {
      setError(t("ticketsFailed"));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const advance = async (ticket: Ticket) => {
    const status = NEXT_STATUS[ticket.status];
    setBusy(ticket.id);
    /* Optimistic: the list re-sorts the moment you press it, which is the
       feedback that matters. A failure puts the old value back. */
    setRows((prev) =>
      prev ? prev.map((r) => (r.id === ticket.id ? { ...r, status } : r)) : prev,
    );
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: ticket.id, status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRows((prev) =>
        prev ? prev.map((r) => (r.id === ticket.id ? { ...r, status: ticket.status } : r)) : prev,
      );
      setError(t("ticketsFailed"));
    } finally {
      setBusy(null);
    }
  };

  const unresolved = rows?.filter((r) => r.status !== "done").length ?? 0;

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
            <Icon name="mail" size={16} />
          </span>
          <span className="font-condensed text-sm font-bold uppercase tracking-widest">
            {t("ticketsTitle")}
          </span>
          {unresolved > 0 && (
            <span className="rounded-full bg-blood px-2 py-0.5 font-condensed text-[0.65rem] font-bold tracking-wider text-white">
              {unresolved}
            </span>
          )}
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
          {rows?.length === 0 && <p className="pt-4 text-sm text-ash-dim">{t("ticketsEmpty")}</p>}

          {rows && rows.length > 0 && (
            <ul className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto overscroll-contain">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className={`rounded-xl border px-3.5 py-3 text-sm ${
                    r.status === "done" ? "border-line/40 opacity-60" : "border-line/60"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-condensed text-xs uppercase tracking-wider text-blood">
                      {t(`ticketTopic_${r.topic}`)}
                    </span>
                    <a
                      href={`mailto:${r.email}?subject=RingBornn support #${r.id}`}
                      className="font-semibold text-bone hover:text-blood hover:underline"
                    >
                      {r.email}
                    </a>
                    {!r.user_id && (
                      <span className="font-condensed text-[0.65rem] uppercase tracking-wider text-ash-dim">
                        {t("ticketNoAccount")}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 whitespace-pre-wrap break-words leading-relaxed text-ash">
                    {r.message}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-ash-dim">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-mono">#{r.id}</span>
                      <time dateTime={r.created_at}>
                        {new Date(r.created_at).toLocaleString()}
                      </time>
                      {r.page && <span className="break-all">{r.page}</span>}
                    </span>
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => advance(r)}
                      className="min-h-[34px] rounded-lg border border-line px-3 font-condensed text-[0.7rem] uppercase tracking-wider text-ash transition-colors hover:border-blood/50 hover:text-bone disabled:opacity-50"
                    >
                      {t(`ticketAction_${r.status}`)}
                    </button>
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
