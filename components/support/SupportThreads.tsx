"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { hasUnread, REPLY_MAX, type SupportThread } from "@/lib/support";

/* Your requests, and what we said back.

   Support used to be one-directional: you wrote in and hoped an email arrived.
   The answer now lives on the request itself, where you filed it, and you can
   write back without starting a second ticket nobody can connect to the first.

   Only rendered for signed-in visitors -- a request filed while signed out has
   no account to attach it to, and email remains its only route. */

function when(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export function SupportThreads({ locale }: { locale: string }) {
  const t = useTranslations("support");
  const [threads, setThreads] = useState<SupportThread[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/support/threads")
      .then((r) => (r.ok ? r.json() : { threads: [] }))
      .then((d) => {
        if (alive) setThreads(d.threads ?? []);
      })
      .catch(() => {
        if (alive) setThreads([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function open(id: number) {
    const next = openId === id ? null : id;
    setOpenId(next);
    setDraft("");
    if (next === null) return;
    /* Clearing the marker is fire-and-forget: failing to record that it was
       read is not worth an error in front of someone reading it. */
    void fetch("/api/support/threads", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
    setThreads((ts) =>
      ts
        ? ts.map((x) => (x.id === id ? { ...x, user_seen_at: new Date().toISOString() } : x))
        : ts,
    );
  }

  async function send(id: number) {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/support/threads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, body }),
      });
      if (!res.ok) throw new Error();
      setThreads((ts) =>
        ts
          ? ts.map((x) =>
              x.id === id
                ? {
                    ...x,
                    status: "open",
                    replies: [
                      ...x.replies,
                      {
                        id: Date.now(),
                        author: "user" as const,
                        body,
                        created_at: new Date().toISOString(),
                      },
                    ],
                  }
                : x,
            )
          : ts,
      );
      setDraft("");
    } catch {
      /* left in the box so nothing typed is lost */
    } finally {
      setBusy(false);
    }
  }

  // nothing filed yet, or still loading: this section simply isn't there
  if (!threads?.length) return null;

  return (
    <section className="mt-10">
      <h2 className="font-condensed text-sm font-bold uppercase tracking-widest text-ash">
        {t("threadsTitle")}
      </h2>
      <ul className="mt-4 space-y-2">
        {threads.map((th) => {
          const unread = hasUnread(th);
          const isOpen = openId === th.id;
          return (
            <li key={th.id} className="panel overflow-hidden">
              <button
                type="button"
                onClick={() => void open(th.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-bone/[0.02]"
              >
                <span className={unread ? "text-blood" : "text-ash-dim"}>
                  <Icon name="mail" size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm text-bone">
                      {t(`topic_${th.topic}`)}
                    </span>
                    {unread && (
                      <span className="shrink-0 rounded-full bg-blood px-2 py-0.5 font-condensed text-[0.6rem] uppercase tracking-widest text-white">
                        {t("threadNew")}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                    {when(th.created_at, locale)} · {t(`status_${th.status}`)}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-ash-dim transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <Icon name="chevron" size={14} />
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-line/70 px-5 py-4">
                  <article className="text-sm leading-relaxed text-ash">
                    <p className="font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                      {t("threadYou")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-bone">{th.message}</p>
                  </article>

                  {th.replies.map((r) => (
                    <article
                      key={r.id}
                      className={`mt-4 border-l-2 pl-3 text-sm leading-relaxed ${
                        r.author === "admin" ? "border-blood/60" : "border-line"
                      }`}
                    >
                      <p className="font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
                        {r.author === "admin" ? t("threadUs") : t("threadYou")} ·{" "}
                        {when(r.created_at, locale)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-bone">{r.body}</p>
                    </article>
                  ))}

                  <div className="mt-4">
                    <textarea
                      rows={3}
                      maxLength={REPLY_MAX}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={t("threadReplyPlaceholder")}
                      className="w-full resize-y border border-line bg-void px-3 py-2 text-sm text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={busy || !draft.trim()}
                      onClick={() => void send(th.id)}
                      className="btn btn-primary mt-2 !px-5 !py-2 text-xs disabled:opacity-50"
                    >
                      {busy ? t("threadSending") : t("threadSend")}
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
