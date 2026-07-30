"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { wipeLocal } from "@/lib/tracking";

/* Self-serve account deletion. The privacy policy promises people can have
   their data removed, and a promise with no button is just a promise.

   Deliberately awkward to trigger: collapsed by default, and you have to type
   the word before the button does anything. This is the one irreversible
   action a normal user can take on their own account. */

const CONFIRM_WORD = "DELETE";

export function DangerZone() {
  const t = useTranslations("account");
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingNote, setBillingNote] = useState<string | null>(null);

  /* Sends them to the payment provider's own portal — cancelling, card
     changes and invoices all live there rather than in screens we would have
     to build and keep correct. */
  const openBilling = async () => {
    setBillingBusy(true);
    setBillingNote(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      setBillingNote(
        data.error === "no_customer" || data.error === "billing_off"
          ? t("noSubscription")
          : t("billingFailed"),
      );
    } catch {
      setBillingNote(t("billingFailed"));
    } finally {
      setBillingBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: CONFIRM_WORD }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error === "no_service_key" ? t("deleteUnavailable") : t("deleteFailed"));
        setBusy(false);
        return;
      }
      // the server rows are gone; drop this browser's copy before leaving,
      // or the next sign-in would push the deleted data back up
      wipeLocal();
      window.location.href = "/?deleted=1";
    } catch {
      setError(t("deleteFailed"));
      setBusy(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-line/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-ash-dim">
            <Icon name="lock" size={14} />
          </span>
          <h2 className="font-condensed text-xs font-bold uppercase tracking-widest text-ash">
            {t("dangerTitle")}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* The refund policy promises cancelling takes no email and no
              waiting. This is the link that has to make that true. */}
          <button
            type="button"
            onClick={openBilling}
            disabled={billingBusy}
            className="font-condensed text-xs uppercase tracking-widest text-ash-dim underline-offset-4 transition-colors hover:text-bone hover:underline disabled:opacity-50"
          >
            {billingBusy ? "…" : t("manageBilling")}
          </button>
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="font-condensed text-xs uppercase tracking-widest text-ash-dim underline-offset-4 transition-colors hover:text-blood hover:underline"
            >
              {t("deleteAccount")}
            </button>
          )}
        </div>
      </div>
      {billingNote && <p className="mt-3 text-xs text-ash-dim">{billingNote}</p>}

      {open && (
        <div className="mt-4 border-t border-line/70 pt-4">
          <p className="text-sm leading-relaxed text-ash">{t("deleteWhat")}</p>
          <ul className="mt-3 space-y-1.5">
            {["deleteItem1", "deleteItem2", "deleteItem3"].map((k) => (
              <li key={k} className="flex gap-2.5 text-sm text-ash-dim">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blood" />
                {t(k)}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-semibold text-blood-bright">{t("deleteFinal")}</p>

          <label
            htmlFor="delete-confirm"
            className="mt-4 block font-condensed text-xs uppercase tracking-widest text-ash"
          >
            {t("deleteTypePrompt", { word: CONFIRM_WORD })}
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              id="delete-confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-line bg-void/70 px-4 py-2.5 text-base text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none sm:text-sm"
            />
            <button
              type="button"
              disabled={typed.trim() !== CONFIRM_WORD || busy}
              onClick={remove}
              className="rounded-xl border border-blood/50 px-4 py-2.5 font-condensed text-xs uppercase tracking-wider text-blood transition-colors hover:bg-blood hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-blood"
            >
              {busy ? "…" : t("deleteConfirmBtn")}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
                setError(null);
              }}
              className="btn btn-ghost !px-4 !py-2.5 text-xs"
            >
              {t("cancel")}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-blood-bright" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
