"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { bumpUsage, type LimitState } from "@/lib/tracking";
import { fetchLimit } from "@/lib/quota-client";

/* Ask the coach a question.

   The cheapest thing in the app to run and the closest it gets to what people
   actually want from a corner — to ask something and be answered, rather than
   be handed a plan and left to work it out.

   Deliberately not a chat. A thread invites "and another thing", which costs
   money per turn and encourages the app to be used as a search engine. One
   question, one answer, ask again if you want. */

const SUGGESTION_KEYS = ["q1", "q2", "q3"] as const;

export function AskCoach() {
  const t = useTranslations("coach");
  const tp = useTranslations("plans");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<LimitState | null>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetchLimit("coachAsk").then((l) => {
      if (alive) setLimit(l);
    });
    return () => {
      alive = false;
    };
  }, []);

  const ask = async (text: string) => {
    const q = text.trim();
    if (q.length < 3 || asking) return;
    setAsking(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok || !data.answer) {
        setError(
          data.error === "quota_exceeded"
            ? t("errLimit")
            : data.error === "no_ai"
              ? t("errOffline")
              : t("errFailed"),
        );
        /* Re-read from the server: a rejection usually means the real counter
           and the local mirror had drifted apart. */
        fetchLimit("coachAsk").then(setLimit);
        return;
      }
      setAnswer(data.answer);
      bumpUsage("coachAsk"); // optimistic mirror; the server already spent it
      fetchLimit("coachAsk").then(setLimit);
      requestAnimationFrame(() =>
        answerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
      );
    } catch {
      setError(t("errFailed"));
    } finally {
      setAsking(false);
    }
  };

  if (limit?.locked) {
    return (
      <section className="panel p-6">
        <div className="flex items-center gap-2.5">
          <span className="text-blood">
            <Icon name="belt" size={18} />
          </span>
          <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
            {t("title")}
          </h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ash">{t("locked")}</p>
        <Link href="/plans" className="btn btn-primary mt-4 !px-5 !py-2.5 text-xs">
          {tp("seePlans")}
        </Link>
      </section>
    );
  }

  const left = limit ? Math.max(0, limit.limit - limit.used) : null;
  const spent = limit ? !limit.ok : false;

  return (
    <section className="panel p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-blood">
            <Icon name="belt" size={18} />
          </span>
          <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
            {t("title")}
          </h2>
        </div>
        {left !== null && Number.isFinite(limit?.limit) && (
          <span className="font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
            {t("left", { n: left })}
          </span>
        )}
      </div>
      <p className="text-xs leading-relaxed text-ash-dim">{t("sub")}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
        className="mt-4"
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            /* Enter sends, Shift+Enter breaks the line — the shape people
               already expect from every message box they use. */
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void ask(question);
            }
          }}
          rows={2}
          maxLength={400}
          disabled={spent}
          placeholder={t("placeholder")}
          className="w-full resize-y rounded-md border border-line bg-void px-3.5 py-3 text-base leading-relaxed text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={asking || spent || question.trim().length < 3}
          className="btn btn-primary mt-2 w-full !py-2.5 text-sm disabled:opacity-40"
        >
          {asking ? t("asking") : t("ask")}
        </button>
      </form>

      {/* Openers, so an empty box is not the first thing someone meets. */}
      {!answer && !asking && !spent && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTION_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setQuestion(t(k));
                void ask(t(k));
              }}
              className="rounded-full border border-line px-3 py-1.5 text-xs text-ash transition-colors hover:border-blood/50 hover:text-bone"
            >
              {t(k)}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-blood/40 bg-blood/10 px-4 py-3 text-sm text-blood-bright">
          {error}
        </p>
      )}

      {answer && (
        <div
          ref={answerRef}
          className="mt-4 rounded-xl border border-blood/40 bg-blood/5 p-4"
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-bone">{answer}</p>
          <p className="mt-3 text-[0.65rem] leading-relaxed text-ash-dim">{t("disclaimer")}</p>
        </div>
      )}

      {spent && (
        <p className="mt-4 text-xs leading-relaxed text-ash-dim">{t("spent")}</p>
      )}
    </section>
  );
}
