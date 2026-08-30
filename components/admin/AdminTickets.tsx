"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { REPLY_MAX, type SupportStatus } from "@/lib/support";

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

/* Opens Gmail's compose window with the reply already addressed and the
   ticket number in the subject.

   Not a mailto: link — that hands off to whatever desktop mail client the
   machine has registered, which on a machine with none simply does nothing
   and looks broken. This goes to the web client the support inbox actually
   lives in, and quotes what the person wrote so the reply has context. */
function gmailReplyUrl(t: Ticket): string {
  const subject = `Re: RingBornn support #${t.id}`;
  const quoted = t.message
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  const body = `\n\n---\nYou wrote:\n${quoted}`;
  return (
    "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(t.email)}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  );
}

export function AdminTickets() {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  /* Which ticket's reply box is open, and what is typed in it. Kept here
     rather than per-row so only one is ever open at a time. */
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<number | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  async function removeTicket(id: number) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tickets?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setRows((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
      setConfirmDelete(null);
    } catch {
      setError(t("ticketsFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function sendReply(id: number) {
    const body = draft.trim();
    if (!body) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/tickets/reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, body }),
      });
      if (!res.ok) throw new Error();
      setDraft("");
      setReplyTo(null);
      setSent(id);
      /* The reply moves the ticket to "open"; reload so the row shows it. */
      await load();
    } catch {
      setError(t("ticketsFailed"));
    } finally {
      setBusy(null);
    }
  }

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
                      href={gmailReplyUrl(r)}
                      target="_blank"
                      rel="noreferrer"
                      title={t("ticketReplyHint")}
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
                    <span className="flex items-center gap-2">
                      {/* Only a ticket filed by a signed-in user has somewhere
                          in the app to put the answer. For the rest, email is
                          still the only route we have to them. */}
                      {r.user_id ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyTo(replyTo === r.id ? null : r.id);
                            setDraft("");
                            setSent(null);
                          }}
                          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-blood/40 px-3 font-condensed text-[0.7rem] uppercase tracking-wider text-blood transition-colors hover:bg-blood/10"
                        >
                          <Icon name="mail" size={12} />
                          {t("ticketReplyHere")}
                        </button>
                      ) : (
                        <a
                          href={gmailReplyUrl(r)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-blood/40 px-3 font-condensed text-[0.7rem] uppercase tracking-wider text-blood transition-colors hover:bg-blood/10"
                        >
                          <Icon name="mail" size={12} />
                          {t("ticketReply")}
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => advance(r)}
                        className="min-h-[34px] rounded-lg border border-line px-3 font-condensed text-[0.7rem] uppercase tracking-wider text-ash transition-colors hover:border-blood/50 hover:text-bone disabled:opacity-50"
                      >
                        {t(`ticketAction_${r.status}`)}
                      </button>
                      {confirmDelete === r.id ? (
                        <>
                          <button
                            type="button"
                            disabled={busy === r.id}
                            onClick={() => void removeTicket(r.id)}
                            className="min-h-[34px] rounded-lg border border-blood bg-blood/20 px-3 font-condensed text-[0.7rem] uppercase tracking-wider text-blood-bright transition-colors hover:bg-blood/30 disabled:opacity-50"
                          >
                            {t("ticketDeleteConfirm")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="min-h-[34px] rounded-lg border border-line px-3 font-condensed text-[0.7rem] uppercase tracking-wider text-ash transition-colors hover:text-bone"
                          >
                            {t("ticketCancel")}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(r.id)}
                          aria-label={t("ticketDelete")}
                          title={t("ticketDelete")}
                          className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-line text-ash-dim transition-colors hover:border-blood/50 hover:text-blood"
                        >
                          <Icon name="close" size={13} />
                        </button>
                      )}
                    </span>
                  </div>

                  {replyTo === r.id && (
                    <div className="mt-3 border-t border-line/60 pt-3">
                      <textarea
                        autoFocus
                        rows={4}
                        maxLength={REPLY_MAX}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={t("ticketReplyPlaceholder")}
                        className="w-full resize-y border border-line bg-void px-3 py-2 text-sm text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busy === r.id || !draft.trim()}
                          onClick={() => void sendReply(r.id)}
                          className="min-h-[34px] rounded-lg border border-blood/50 bg-blood/10 px-3 font-condensed text-[0.7rem] uppercase tracking-wider text-blood transition-colors hover:bg-blood/20 disabled:opacity-50"
                        >
                          {busy === r.id ? t("ticketSending") : t("ticketSend")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyTo(null)}
                          className="min-h-[34px] rounded-lg border border-line px-3 font-condensed text-[0.7rem] uppercase tracking-wider text-ash transition-colors hover:text-bone"
                        >
                          {t("ticketCancel")}
                        </button>
                      </div>
                    </div>
                  )}

                  {sent === r.id && (
                    <p className="mt-2 font-condensed text-[0.7rem] uppercase tracking-wider text-blood">
                      {t("ticketSentNote")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
