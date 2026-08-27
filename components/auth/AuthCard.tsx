"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icons";
import { MIN_PASSWORD_LENGTH, passwordLongEnough } from "@/lib/auth-rules";
import { LEGAL_UPDATED } from "@/lib/legal";

const inputCls =
  "w-full border border-line bg-void px-4 py-3 text-base text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none";

/**
 * Leave for `next` with a full page load rather than a client navigation.
 *
 * Signing up sent people straight back to the login screen, and they had to
 * authenticate a second time before they could reach their plan. A
 * client-side push after auth can be answered with a redirect in two
 * different ways, and both were live here: Next may replay a cached entry for
 * the destination — /onboarding is guarded, so a signed-out visit to it
 * stores a 307 to /login — or the RSC request may simply go out before the
 * server can see the session cookie the browser has only just written.
 *
 * A full page load removes both at once: no client cache to consult, and the
 * cookie is on the request by definition. It costs one page load, once, at
 * the only point in the app where being wrong is this expensive.
 */
function go(next: string) {
  window.location.assign(next);
}

export function AuthCard({
  mode,
  next = "/dashboard",
  hadError = false,
  banned = false,
}: {
  mode: "login" | "register";
  next?: string;
  hadError?: boolean;
  banned?: boolean;
}) {
  const t = useTranslations("auth");
  /* Whether Supabase keys are present is only knowable in the real browser
     (the runtime env is injected into window.__PRESSURE_ENV). We render
     optimistically (assume connected) so a correctly-configured deploy never
     flashes a false "not connected", then confirm on mount. */
  const [configured, setConfigured] = useState(true);
  useEffect(() => {
    setConfigured(isSupabaseConfigured());
  }, []);
  const router = useRouter();
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    banned ? t("errBanned") : hadError ? t("errLink") : null,
  );
  const [loading, setLoading] = useState<null | "email">(null);
  /* Accepting the terms is required to create an account, and is deliberately
     unticked to start with: a pre-ticked box is not agreement, and several
     regimes treat it as no agreement at all. Existing users signing in have
     already accepted, so the box only appears on the register form. */
  const [agreed, setAgreed] = useState(false);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!configured) return setError(t("notConnected"));
    /* Only when creating an account — an existing user whose password predates
       this rule must still be able to log in with it. */
    if (!isLogin && !agreed) return setError(t("agreeErr"));
    if (!isLogin && !passwordLongEnough(password)) {
      return setError(t("errShortPw", { n: MIN_PASSWORD_LENGTH }));
    }

    setLoading("email");
    const supabase = createClient();
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        go(next);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            /* Stored on the account so the acceptance is provable later —
               which version was agreed to, and when. A tick box nobody
               recorded is worth very little if it is ever questioned. */
            data: {
              terms_accepted_at: new Date().toISOString(),
              terms_version: LEGAL_UPDATED,
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          go(next);
        } else {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errGeneric"));
      setLoading(null);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center">
        <p className="kicker justify-center">
          {isLogin ? t("welcomeBack") : t("join")}
        </p>
        <h1 className="mt-4 font-display text-[clamp(1.56rem, 7vw, 3rem)] uppercase leading-none">
          {isLogin ? t("loginTitlePre") : t("registerTitlePre")}
          <span className="text-blood">
            {isLogin ? t("loginTitleAccent") : t("registerTitleAccent")}
          </span>
        </h1>
      </div>

      <div className="panel mt-8 p-7">
        {!configured && (
          <p className="mb-5 flex items-start gap-2 rounded-xl border border-blood/40 bg-blood/5 px-3 py-2.5 text-xs text-ash">
            <span className="mt-0.5 text-blood">
              <Icon name="lock" size={13} />
            </span>
            {t("notConnected")}
          </p>
        )}


        <form onSubmit={handleEmail} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-condensed text-xs uppercase tracking-widest text-ash"
            >
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-condensed text-xs uppercase tracking-widest text-ash"
            >
              {t("password")}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={isLogin ? undefined : MIN_PASSWORD_LENGTH}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder={
                isLogin
                  ? t("pwLoginPlaceholder")
                  : t("pwRegisterPlaceholder", { n: MIN_PASSWORD_LENGTH })
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>

          {!isLogin && (
            <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-ash">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-blood"
              />
              <span>
                {t("agreePre")}{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-semibold text-blood hover:underline"
                >
                  {t("agreeTerms")}
                </Link>{" "}
                {t("agreeMid")}{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-semibold text-blood hover:underline"
                >
                  {t("agreePrivacy")}
                </Link>
                .
              </span>
            </label>
          )}

          {error && <p className="text-sm text-blood-bright">{error}</p>}

          <button
            type="submit"
            disabled={loading !== null || (!isLogin && !agreed)}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading === "email"
              ? t("working")
              : isLogin
                ? t("logIn")
                : t("createAccount")}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-ash">
        {isLogin ? t("newHere") : t("haveAccount")}
        <Link
          href={`${isLogin ? "/register" : "/login"}${
            next && next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""
          }`}
          className="font-semibold text-blood transition-colors hover:text-blood-bright"
        >
          {isLogin ? t("createLink") : t("loginLink")}
        </Link>
      </p>
    </div>
  );
}
