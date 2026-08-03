"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";

/* Turning the second factor on or off for the signed-in admin.

   No QR image: rendering one would mean shipping an encoder for a string the
   authenticator app will happily take by hand. The secret is shown in groups
   of four so it can be typed without losing your place, and the otpauth link
   works directly on a phone. */

type Phase = "loading" | "off" | "setup" | "on";

export function AdminTotp() {
  const t = useTranslations("admin");
  const [phase, setPhase] = useState<Phase>("loading");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/totp")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive) setPhase(d?.enrolled ? "on" : "off");
      })
      .catch(() => {
        if (alive) setPhase("off");
      });
    return () => {
      alive = false;
    };
  }, []);

  const call = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/totp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error === "bad_code" ? t("twofaBadCode") : t("twofaFailed"));
        return null;
      }
      return d;
    } catch {
      setError(t("twofaFailed"));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    const d = await call("start");
    if (!d) return;
    setSecret(d.secret);
    setUri(d.uri);
    setCode("");
    setPhase("setup");
  };

  const confirm = async () => {
    const d = await call("confirm", { code });
    if (!d) return;
    setSecret("");
    setUri("");
    setCode("");
    setPhase("on");
  };

  const disable = async () => {
    const d = await call("disable", { code });
    if (!d) return;
    setCode("");
    setPhase("off");
  };

  if (phase === "loading") return null;

  const codeInput = (
    <input
      value={code}
      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
      placeholder="000000"
      inputMode="numeric"
      maxLength={6}
      autoComplete="one-time-code"
      className="w-36 rounded-xl border border-line bg-void/70 px-4 py-2.5 text-center font-condensed text-lg tracking-[0.3em] text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none"
    />
  );

  return (
    <section className="panel mt-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={phase === "on" ? "text-moss" : "text-ash-dim"}>
            <Icon name={phase === "on" ? "check" : "lock"} size={17} />
          </span>
          <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
            {t("twofaTitle")}
          </h2>
        </div>
        <span
          className={`font-condensed text-[0.65rem] uppercase tracking-widest ${
            phase === "on" ? "text-blood" : "text-ash-dim"
          }`}
        >
          {t(phase === "on" ? "twofaOn" : "twofaOff")}
        </span>
      </div>

      <p className="mt-2 max-w-xl text-sm text-ash">{t("twofaIntro")}</p>

      {phase === "off" && (
        <button
          type="button"
          onClick={start}
          disabled={busy}
          className="btn btn-primary mt-4 !px-5 !py-2.5 text-xs"
        >
          {busy ? "…" : t("twofaEnable")}
        </button>
      )}

      {phase === "setup" && (
        <div className="mt-4 border-t border-line/70 pt-4">
          <p className="text-sm text-ash">{t("twofaStep1")}</p>
          <p className="mt-2 select-all break-all rounded-xl border border-line bg-void/70 p-3 font-mono text-sm tracking-wider text-bone">
            {secret.replace(/(.{4})/g, "$1 ").trim()}
          </p>
          <a
            href={uri}
            className="mt-2 inline-block font-condensed text-xs uppercase tracking-wider text-blood hover:underline"
          >
            {t("twofaOpenApp")}
          </a>

          <p className="mt-4 text-sm text-ash">{t("twofaStep2")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {codeInput}
            <button
              type="button"
              onClick={confirm}
              disabled={busy || code.length !== 6}
              className="btn btn-primary !px-5 !py-2.5 text-xs disabled:opacity-50"
            >
              {busy ? "…" : t("twofaConfirm")}
            </button>
            <button
              type="button"
              onClick={() => setPhase("off")}
              className="btn btn-ghost !px-4 !py-2.5 text-xs"
            >
              {t("cancel")}
            </button>
          </div>
          <p className="mt-3 text-xs text-ash-dim">{t("twofaSecretOnce")}</p>
        </div>
      )}

      {phase === "on" && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/70 pt-4">
          {codeInput}
          <button
            type="button"
            onClick={disable}
            disabled={busy || code.length !== 6}
            className="rounded-xl border border-blood/50 px-4 py-2.5 font-condensed text-xs uppercase tracking-wider text-blood transition-colors hover:bg-blood hover:text-white disabled:opacity-40"
          >
            {busy ? "…" : t("twofaDisable")}
          </button>
          <span className="text-xs text-ash-dim">{t("twofaDisableHint")}</span>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-blood-bright">{error}</p>}
    </section>
  );
}
