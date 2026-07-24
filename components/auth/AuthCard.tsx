"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icons";

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.3 0-1.3-.1-2.3-.4-4.3z"
      />
    </svg>
  );
}

const inputCls =
  "w-full border border-line bg-void px-4 py-3 text-base text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none";

export function AuthCard({
  mode,
  next = "/dashboard",
  hadError = false,
}: {
  mode: "login" | "register";
  next?: string;
  hadError?: boolean;
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
  // only show the Google button once the provider is actually set up in Supabase
  const googleOn = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true";
  const router = useRouter();
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    hadError ? t("errLink") : null,
  );
  const [loading, setLoading] = useState<null | "email" | "google">(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!configured) return setError(t("notConnected"));
    if (password.length < 6) return setError(t("errShortPw"));

    setLoading("email");
    const supabase = createClient();
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(next);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errGeneric"));
      setLoading(null);
    }
  }

  async function handleGoogle() {
    setError(null);
    if (!configured) return setError(t("notConnected"));
    setLoading("google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center">
        <p className="kicker justify-center">
          {isLogin ? t("welcomeBack") : t("join")}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2rem,7vw,3rem)] uppercase leading-none">
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

        {googleOn && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading !== null}
              className="btn btn-ghost w-full disabled:opacity-50"
            >
              <GoogleG />
              {loading === "google" ? t("redirecting") : t("google")}
            </button>

            <div className="my-5 flex items-center gap-4">
              <span className="h-px flex-1 bg-line" />
              <span className="font-condensed text-xs uppercase tracking-widest text-ash-dim">
                {t("or")}
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
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
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder={isLogin ? t("pwLoginPlaceholder") : t("pwRegisterPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>

          {error && <p className="text-sm text-blood-bright">{error}</p>}

          <button
            type="submit"
            disabled={loading !== null}
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
