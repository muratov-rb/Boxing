"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";

/* Login wall in front of the admin panel: one fixed name and password, both
   checked server-side (/api/admin-login). Success sets an httpOnly cookie.
   No user account is involved. */

export function AdminGate({ configured }: { configured: boolean }) {
  const t = useTranslations("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      if (res.status === 429) {
        const { retryAfter } = (await res.json()) as { retryAfter?: number };
        setError(t("gateLocked", { minutes: Math.ceil((retryAfter ?? 900) / 60) }));
        return;
      }
      setError(res.status === 503 ? t("gateUnconfigured") : t("gateWrong"));
    } catch {
      setError(t("gateWrong"));
    } finally {
      setBusy(false);
    }
  };

  return (
    /* Same surface as the panel behind it: the login screen should not
       look like a different product from the thing it opens. */
    <div className="admin-shell flex min-h-dvh items-center justify-center px-4">
      <div className="panel w-full max-w-sm p-7 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-blood/40 text-blood">
          <Icon name="lock" size={26} />
        </div>
        <h1 className="mt-4 font-display text-2xl uppercase">{t("gateTitle")}</h1>
        <p className="mt-2 text-sm text-ash">
          {configured ? t("gateSub") : t("gateUnconfigured")}
        </p>

        {configured && (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("gateUser")}
              autoComplete="username"
              autoFocus
              className="w-full rounded-xl border border-line bg-void px-4 py-3 text-center font-condensed text-lg text-bone placeholder:text-ash-dim transition-colors focus:border-blood focus:outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("gatePlaceholder")}
              autoComplete="current-password"
              className="w-full rounded-xl border border-line bg-void px-4 py-3 text-center font-condensed text-lg text-bone placeholder:text-ash-dim transition-colors focus:border-blood focus:outline-none"
            />
            {error && (
              <p className="text-xs text-blood-bright" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || password.length === 0 || username.length === 0}
              className="btn btn-primary w-full"
            >
              {busy ? "…" : t("gateEnter")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
