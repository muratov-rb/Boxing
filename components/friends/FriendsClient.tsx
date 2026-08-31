"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { AppNav } from "@/components/nav/AppNav";
import {
  CHALLENGE_KINDS,
  CHALLENGE_MAX,
  type Challenge,
  type ChallengeKind,
  type Partner,
} from "@/lib/friends";
import { rankFromXp } from "@/lib/xp";

/* Training partners.

   Someone who trains alone quits alone. A partner who can see the streak is
   the cheapest motivation there is, so the list leads with each person's
   streak rather than their name. */

export function FriendsClient() {
  const t = useTranslations("friends");
  const tr = useTranslations("ranks");
  const [code, setCode] = useState("");
  const [friends, setFriends] = useState<Partner[]>([]);
  const [pending, setPending] = useState<Partner[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [add, setAdd] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [challengeTo, setChallengeTo] = useState<Partner | null>(null);
  const [cKind, setCKind] = useState<ChallengeKind>("exercise");
  const [cBody, setCBody] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [f, c] = await Promise.all([
        fetch("/api/friends").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/challenges").then((r) => (r.ok ? r.json() : null)),
      ]);
      if (f) {
        setCode(f.code ?? "");
        setFriends(f.friends ?? []);
        setPending(f.pending ?? []);
      }
      if (c) setChallenges(c.challenges ?? []);
    } catch {
      /* an empty list is the honest fallback */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendRequest() {
    const value = add.trim();
    if (!value || busy) return;
    setBusy(true);
    setNote(null);
    try {
      /* An @ means they pasted an address; anything else is treated as a code. */
      const payload = value.includes("@") ? { email: value } : { code: value };
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        const key =
          d.error === "already_linked"
            ? "errAlready"
            : d.error === "no_such_code"
              ? "errNoCode"
              : d.error === "bad_code"
                ? "errBadCode"
                : d.error === "too_many_friends"
                  ? "errTooMany"
                  : "errGeneric";
        setNote({ kind: "err", text: t(key) });
        return;
      }
      setAdd("");
      setNote({ kind: "ok", text: value.includes("@") ? t("sentEmail") : t("sentCode") });
      await load();
    } catch {
      setNote({ kind: "err", text: t("errGeneric") });
    } finally {
      setBusy(false);
    }
  }

  async function respond(id: number, action: "accept" | "decline") {
    setBusy(true);
    try {
      await fetch("/api/friends", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeFriend(id: number) {
    setBusy(true);
    try {
      await fetch(`/api/friends?id=${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function sendChallenge() {
    if (!challengeTo || !cBody.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: challengeTo.userId, kind: cKind, body: cBody.trim() }),
      });
      if (!res.ok) {
        setNote({ kind: "err", text: t("errGeneric") });
        return;
      }
      setChallengeTo(null);
      setCBody("");
      setNote({ kind: "ok", text: t("challengeSent") });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function respondChallenge(id: number, action: "accept" | "decline" | "done") {
    setBusy(true);
    try {
      await fetch("/api/challenges", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  /* Withdrawing one you sent. Only possible while it is unanswered, which the
     server enforces too -- by the time the button is clicked they may have
     just accepted, and then the honest thing is to say so and show the card
     in its real state rather than pretend the click worked. */
  async function cancelChallenge(id: number) {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(`/api/challenges?id=${id}`, { method: "DELETE" });
      if (!res.ok) setNote({ kind: "err", text: t("errCancelAnswered") });
      await load();
    } catch {
      setNote({ kind: "err", text: t("errGeneric") });
    } finally {
      setBusy(false);
    }
  }

  const open = challenges.filter((c) => c.status === "sent" || c.status === "accepted");

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none">
          {t("titlePre")}
          <span className="text-blood">{t("titleAccent")}</span>
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ash">{t("sub")}</p>

        {/* --------------------------- your own code -------------------------- */}
        <section className="panel mt-8 p-6">
          <h2 className="font-condensed text-sm font-bold uppercase tracking-widest text-ash">
            {t("yourCode")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ash">{t("yourCodeSub")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="select-all rounded-xl border border-blood/40 bg-blood/5 px-5 py-3 font-display text-2xl tracking-[0.35em] text-bone">
              {code || "······"}
            </code>
            {code && (
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(code).then(
                    () => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    },
                    () => {
                      /* clipboard can be blocked; the code is selectable anyway */
                    },
                  );
                }}
                className="btn btn-ghost !px-5 !py-2.5 text-xs"
              >
                {copied ? t("copied") : t("copy")}
              </button>
            )}
          </div>
        </section>

        {/* ----------------------------- add someone -------------------------- */}
        <section className="panel mt-4 p-6">
          <h2 className="font-condensed text-sm font-bold uppercase tracking-widest text-ash">
            {t("addTitle")}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={add}
              onChange={(e) => setAdd(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendRequest();
              }}
              placeholder={t("addPlaceholder")}
              className="min-w-0 flex-1 border border-line bg-void px-4 py-3 text-base text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none"
            />
            <button
              type="button"
              disabled={busy || !add.trim()}
              onClick={() => void sendRequest()}
              className="btn btn-primary !px-6 disabled:opacity-50"
            >
              {t("addButton")}
            </button>
          </div>
          {note && (
            <p className={`mt-3 text-sm ${note.kind === "ok" ? "text-blood" : "text-blood-bright"}`}>
              {note.text}
            </p>
          )}
        </section>

        {/* ------------------------- requests for you ------------------------- */}
        {pending.length > 0 && (
          <section className="mt-8">
            <h2 className="font-condensed text-sm font-bold uppercase tracking-widest text-ash">
              {t("pendingTitle")}
            </h2>
            <ul className="mt-3 space-y-2">
              {pending.map((p) => (
                <li key={p.id} className="panel flex flex-wrap items-center gap-3 p-4">
                  <Avatar p={p} />
                  <span className="min-w-0 flex-1 truncate text-bone">
                    {p.name ?? t("noName")}
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void respond(p.id, "accept")}
                      className="btn btn-primary !px-4 !py-2 text-xs disabled:opacity-50"
                    >
                      {t("accept")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void respond(p.id, "decline")}
                      className="btn btn-ghost !px-4 !py-2 text-xs disabled:opacity-50"
                    >
                      {t("decline")}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ------------------------------ partners ---------------------------- */}
        <section className="mt-8">
          <h2 className="font-condensed text-sm font-bold uppercase tracking-widest text-ash">
            {t("partnersTitle")}
          </h2>
          {loading ? (
            <p className="mt-3 text-sm text-ash-dim">{t("loading")}</p>
          ) : friends.length === 0 ? (
            <p className="mt-3 text-sm leading-relaxed text-ash-dim">{t("noPartners")}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {friends.map((p) => (
                <li key={p.id} className="panel flex flex-wrap items-center gap-3 p-4">
                  <Avatar p={p} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-bone">{p.name ?? t("noName")}</span>
                    {/* Streak, rank and XP: the API already returned all three
                        and the card showed only the streak. Seeing where a
                        partner actually is is the reason to add one. */}
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-condensed text-[0.7rem] uppercase tracking-widest text-ash-dim">
                      <span className="flex items-center gap-1.5">
                        <span className={p.streak > 0 ? "text-blood" : ""}>
                          <Icon name="streak" size={12} />
                        </span>
                        {t("streakDays", { n: p.streak })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-ash-dim">
                          <Icon name="belt" size={12} />
                        </span>
                        {tr(`${rankFromXp(p.xp)}n`)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-ash-dim">
                          <Icon name="bolt" size={12} />
                        </span>
                        {t("xpShort", { xp: p.xp })}
                      </span>
                    </span>
                    {/* The joint streak. Deliberately the loudest thing on the
                        card when it is alive: it is the only number here that
                        somebody else can cost you. */}
                    {p.shared && <SharedStreakRow p={p} t={t} />}
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setChallengeTo(p);
                        setCBody("");
                        setNote(null);
                      }}
                      className="btn btn-ghost !px-4 !py-2 text-xs"
                    >
                      {t("challenge")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeFriend(p.id)}
                      aria-label={t("remove")}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ash-dim transition-colors hover:border-blood/50 hover:text-blood disabled:opacity-50"
                    >
                      <Icon name="close" size={13} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ----------------------------- challenges --------------------------- */}
        {open.length > 0 && (
          <section className="mt-8">
            <h2 className="font-condensed text-sm font-bold uppercase tracking-widest text-ash">
              {t("challengesTitle")}
            </h2>
            <ul className="mt-3 space-y-2">
              {open.map((c) => (
                <li key={c.id} className="panel p-4">
                  <p className="font-condensed text-[0.7rem] uppercase tracking-widest text-blood">
                    {t(`kind_${c.kind}`)} ·{" "}
                    {c.mine
                      ? t("challengeTo", { name: c.otherName ?? t("noName") })
                      : t("challengeFrom", { name: c.otherName ?? t("noName") })}
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-bone">{c.body}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!c.mine && c.status === "sent" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void respondChallenge(c.id, "accept")}
                          className="btn btn-primary !px-4 !py-2 text-xs disabled:opacity-50"
                        >
                          {t("accept")}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void respondChallenge(c.id, "decline")}
                          className="btn btn-ghost !px-4 !py-2 text-xs disabled:opacity-50"
                        >
                          {t("decline")}
                        </button>
                      </>
                    )}
                    {c.status === "accepted" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void respondChallenge(c.id, "done")}
                        className="btn btn-primary !px-4 !py-2 text-xs disabled:opacity-50"
                      >
                        {t("markDone")}
                      </button>
                    )}
                    {c.mine && c.status === "sent" && (
                      <>
                        <span className="self-center font-condensed text-[0.7rem] uppercase tracking-widest text-ash-dim">
                          {t("awaiting")}
                        </span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void cancelChallenge(c.id)}
                          className="btn btn-ghost !px-4 !py-2 text-xs disabled:opacity-50"
                        >
                          {t("withdraw")}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* --------------------------- challenge composer ---------------------- */}
      {challengeTo && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-void/70 p-4 backdrop-blur-sm sm:place-items-center">
          <div className="panel w-full max-w-md p-6">
            <h2 className="font-display text-xl uppercase leading-none">
              {t("challengeTitle", { name: challengeTo.name ?? t("noName") })}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {CHALLENGE_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCKind(k)}
                  className={`rounded-lg border px-3 py-1.5 font-condensed text-[0.7rem] uppercase tracking-wider transition-colors ${
                    cKind === k
                      ? "border-blood/60 bg-blood/10 text-blood"
                      : "border-line text-ash hover:text-bone"
                  }`}
                >
                  {t(`kind_${k}`)}
                </button>
              ))}
            </div>
            <textarea
              autoFocus
              rows={3}
              maxLength={CHALLENGE_MAX}
              value={cBody}
              onChange={(e) => setCBody(e.target.value)}
              placeholder={t(`kindPlaceholder_${cKind}`)}
              className="mt-3 w-full resize-y border border-line bg-void px-3 py-2 text-sm text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy || !cBody.trim()}
                onClick={() => void sendChallenge()}
                className="btn btn-primary !px-5 !py-2.5 text-xs disabled:opacity-50"
              >
                {t("send")}
              </button>
              <button
                type="button"
                onClick={() => setChallengeTo(null)}
                className="btn btn-ghost !px-5 !py-2.5 text-xs"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* The line that makes a partner worth having.

   Three states, and they say different things on purpose:
     alive   -- the number, in blood red, plus who has trained today
     broken  -- who broke it, named, because a number that vanished without a
                reason just looks like a bug
     unstarted -- an invitation, not an accusation

   Today is shown but never blamed: a partner who trains after work has not
   let anyone down at breakfast. */
function SharedStreakRow({
  p,
  t,
}: {
  p: Partner;
  t: ReturnType<typeof useTranslations<"friends">>;
}) {
  const s = p.shared;
  if (!s) return null;
  const name = p.name ?? t("noName");
  const alive = s.days > 0;

  const headline = alive
    ? t("togetherDays", { n: s.days })
    : s.brokeBy === "them"
      ? t("brokeThem", { name })
      : s.brokeBy === "you"
        ? t("brokeYou")
        : s.brokeBy === "both"
          ? t("brokeBoth")
          : t("togetherNone");

  return (
    <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-condensed text-[0.65rem] uppercase tracking-widest ${
          alive
            ? "border-blood/40 bg-blood/10 text-blood"
            : "border-line bg-void/40 text-ash-dim"
        }`}
      >
        <Icon name={alive ? "streak" : "close"} size={11} />
        {headline}
      </span>

      {/* Today, as fact. Two ticks are quicker to read than a sentence, and
          the missing one is the nudge. */}
      <span className="inline-flex items-center gap-2 font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim">
        {t("todayLabel")}
        <span className={s.youToday ? "text-blood" : "text-ash-dim"}>
          {t("todayYou")} {s.youToday ? "✓" : "—"}
        </span>
        <span className={s.themToday ? "text-blood" : "text-ash-dim"}>
          {t("todayThem")} {s.themToday ? "✓" : "—"}
        </span>
      </span>
    </span>
  );
}

function Avatar({ p }: { p: Partner }) {
  if (p.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- user upload from
    // Supabase Storage; next/image would need a remote pattern and buys
    // nothing at 40px.
    return (
      <img
        src={p.avatarUrl}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-full border border-line object-cover"
      />
    );
  }
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ash-dim">
      <Icon name="user" size={18} />
    </span>
  );
}
