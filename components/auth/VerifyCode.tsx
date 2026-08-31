"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { authErrorKey } from "@/lib/auth-errors";
import { safeNext } from "@/lib/safe-next";

/* Confirming a new account by typing a code.

   It replaced a link because a link is the wrong shape for a phone: mail apps
   open it in their own in-app browser, which does not share cookies with the
   real one, so the session it creates lands nowhere and the user meets an
   error. A code is read in one app and typed into another, and the browser
   that started the signup is the browser that finishes it. */

const CODE_LENGTH = 6;
/* Supabase rate-limits resends; anything under a minute is refused anyway, so
   the button says so rather than letting someone hammer it into an error. */
const RESEND_COOLDOWN = 60;

export function VerifyCode({ email, next }: { email: string; next: string }) {
  const t = useTranslations("verify");
  /* Mapped auth errors live in the "auth" namespace, not this one. */
  const ta = useTranslations("auth");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function verify(value: string) {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.verifyOtp({
        email,
        token: value,
        type: "signup",
      });
      if (err) throw err;
      /* Full page load, not a router push: the session cookie has only just
         been written and a client navigation can race it. */
      window.location.assign(safeNext(next));
    } catch (err) {
      /* An expired code and a mistyped one are different problems with
         different fixes -- "ask for a new one" versus "look again". */
      const key = authErrorKey(err);
      setError(key ? ta(key) : t("codeWrong"));
      setCode("");
      inputRef.current?.focus();
      setBusy(false);
    }
  }

  function onChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    setError(null);
    /* Submit itself once the code is complete — nobody wants to type six
       digits and then hunt for a button. */
    if (digits.length === CODE_LENGTH && !busy) void verify(digits);
  }

  async function resend() {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resend({ type: "signup", email });
      if (err) throw err;
      setResent(true);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      const key = authErrorKey(err);
      setError(key ? ta(key) : t("resendFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <label htmlFor="code" className="sr-only">
        {t("codeLabel")}
      </label>
      <input
        ref={inputRef}
        id="code"
        /* text + numeric mode rather than type="number": a number input shows
           spinners, allows a minus sign, and drops leading zeros. */
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={CODE_LENGTH}
        disabled={busy}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        placeholder="······"
        aria-invalid={!!error}
        className="w-full border border-line bg-void px-4 py-4 text-center font-display text-3xl tracking-[0.6em] text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none disabled:opacity-60"
      />

      {error && (
        <p className="mt-3 text-sm text-blood-bright" role="alert">
          {error}
        </p>
      )}
      {busy && !error && <p className="mt-3 text-sm text-ash-dim">{t("checking")}</p>}
      {resent && !error && <p className="mt-3 text-sm text-blood">{t("resentOk")}</p>}

      <button
        type="button"
        onClick={() => void resend()}
        disabled={busy || cooldown > 0}
        className="mt-5 font-condensed text-xs uppercase tracking-widest text-ash transition-colors hover:text-blood disabled:opacity-50"
      >
        {cooldown > 0 ? t("resendIn", { n: cooldown }) : t("resend")}
      </button>
    </div>
  );
}
