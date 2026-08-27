"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import {
  MESSAGE_MAX,
  MESSAGE_MIN,
  SUPPORT_TOPICS,
  looksLikeEmail,
  type SupportTopic,
} from "@/lib/support";

/* The way in. Deliberately reachable without an account: someone locked out of
   their own login is the likeliest person on this page, and a form behind the
   login wall would be useless to exactly them.

   The signed-in email is offered as a starting value rather than forced, since
   a wrong address on the account is itself a thing people write in about. */
export function SupportForm({
  email: accountEmail,
  signedIn = false,
}: {
  email: string | null;
  /* Where the answer will land depends on whether there is an account to
     attach the thread to, not on whether an address was typed in. */
  signedIn?: boolean;
}) {
  const t = useTranslations("support");
  const [topic, setTopic] = useState<SupportTopic>("bug");
  const [email, setEmail] = useState(accountEmail ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<number | null>(null);
  const [page, setPage] = useState("");

  /* Which page they came from, so a bug report about "the button" has some
     chance of being actionable. Read after mount — there is no referrer on the
     server, and reading location during render breaks hydration. */
  useEffect(() => {
    setPage(document.referrer || "");
  }, []);

  const tooShort = message.trim().length < MESSAGE_MIN;
  const badEmail = email.length > 0 && !looksLikeEmail(email);
  const canSend = !sending && !tooShort && looksLikeEmail(email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), topic, message: message.trim(), page }),
      });
      const data = (await res.json()) as { ok?: boolean; id?: number; error?: string };
      if (!res.ok || !data.ok) {
        setError(
          data.error === "too_many"
            ? t("errTooMany")
            : data.error === "not_configured"
              ? t("errOffline")
              : t("errFailed"),
        );
        return;
      }
      setTicket(data.id ?? 0);
    } catch {
      setError(t("errFailed"));
    } finally {
      setSending(false);
    }
  };

  /* ------------------------------- sent ---------------------------------- */
  if (ticket !== null) {
    return (
      <section className="panel p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-blood/40 text-blood">
            <Icon name="check" size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl uppercase leading-none">{t("sentTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ash">
              {signedIn ? t("sentBodyInApp") : t("sentBody", { email })}
            </p>
            <p className="mt-3 font-condensed text-xs uppercase tracking-widest text-ash-dim">
              {t("sentRef", { id: ticket })}
            </p>
            <button
              type="button"
              onClick={() => {
                setTicket(null);
                setMessage("");
              }}
              className="btn btn-ghost mt-5 !px-5 !py-2.5 text-xs"
            >
              {t("sendAnother")}
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* ------------------------------- form ---------------------------------- */
  return (
    <form onSubmit={submit} className="panel p-6 sm:p-8">
      {/* topic */}
      <fieldset>
        <legend className="mb-3 font-condensed text-xs uppercase tracking-widest text-ash">
          {t("topicLabel")}
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {SUPPORT_TOPICS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTopic(id)}
              aria-pressed={topic === id}
              className={`min-h-[45px] rounded-xl border px-3 py-2.5 font-condensed text-xs uppercase tracking-wider transition-colors ${
                topic === id
                  ? "border-blood bg-blood/10 text-bone"
                  : "border-line text-ash hover:border-blood/50"
              }`}
            >
              {t(`topic_${id}`)}
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-ash-dim">{t(`topicHint_${topic}`)}</p>
      </fieldset>

      {/* email */}
      <div className="mt-7">
        <label
          htmlFor="support-email"
          className="mb-2 block font-condensed text-xs uppercase tracking-widest text-ash"
        >
          {t("emailLabel")}
        </label>
        <input
          id="support-email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-line bg-void px-4 py-3 text-base text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none"
        />
        <p className="mt-2 text-xs text-ash-dim">
          {badEmail ? <span className="text-blood-bright">{t("emailBad")}</span> : t("emailHint")}
        </p>
      </div>

      {/* message */}
      <div className="mt-6">
        <label
          htmlFor="support-message"
          className="mb-2 block font-condensed text-xs uppercase tracking-widest text-ash"
        >
          {t("messageLabel")}
        </label>
        <textarea
          id="support-message"
          required
          rows={7}
          maxLength={MESSAGE_MAX}
          placeholder={t("messagePlaceholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-y border border-line bg-void px-4 py-3 text-base leading-relaxed text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none"
        />
        <p className="mt-2 text-right text-xs text-ash-dim">
          {message.length} / {MESSAGE_MAX}
        </p>
      </div>

      {error && (
        <p className="mt-4 border border-blood/40 bg-blood/10 px-4 py-3 text-sm text-blood-bright">
          {error}
        </p>
      )}

      <button type="submit" disabled={!canSend} className="btn btn-primary mt-6 w-full sm:w-auto">
        {sending ? t("sending") : t("send")}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-blood/90">
        {signedIn ? t("replyHereNote") : t("replyMailNote")}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-ash-dim">{t("privacyNote")}</p>
    </form>
  );
}
