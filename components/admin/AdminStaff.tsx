"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-rules";

/* Staff accounts and the audit trail. Owner-only, and loaded on demand — the
   list contains who can reach the panel and what they have done to people's
   accounts, so it is not something to fetch for every visitor of every page. */

interface Staff {
  username: string;
  role: "owner" | "support";
  created_at: string;
  created_by: string | null;
  last_login: string | null;
}

interface AuditRow {
  actor: string;
  role: string | null;
  action: string;
  target_user: string | null;
  detail: Record<string, unknown>;
  at: string;
}

export function AdminStaff() {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/staff");
    if (!res.ok) return setError(t("staffLoadFailed"));
    const d = (await res.json()) as { owner: string; staff: Staff[]; audit: AuditRow[] };
    setOwner(d.owner);
    setStaff(d.staff);
    setAudit(d.audit);
  };

  const openPanel = async () => {
    setOpen(true);
    setError(null);
    await load();
  };

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: name, password: pw, role: "support" }),
      });
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(
          d.error === "name_taken"
            ? t("staffNameTaken")
            : d.error === "weak_password"
              ? t("staffWeakPw", { n: MIN_PASSWORD_LENGTH })
              : d.error === "bad_username"
                ? t("staffBadName")
                : t("staffCreateFailed"),
        );
        return;
      }
      setName("");
      setPw("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (username: string) => {
    if (!window.confirm(t("staffRemoveConfirm", { name: username }))) return;
    await fetch(`/api/admin/staff?username=${encodeURIComponent(username)}`, {
      method: "DELETE",
    });
    await load();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={openPanel}
        className="btn btn-ghost mt-8 !px-4 !py-2.5 text-xs"
      >
        {t("staffOpen")}
      </button>
    );
  }

  const input =
    "min-w-0 flex-1 rounded-xl border border-line bg-void/70 px-4 py-2.5 text-base text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none sm:text-sm";

  return (
    <section className="panel mt-8 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
          {t("staffTitle")}
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-condensed text-xs uppercase tracking-widest text-ash-dim hover:text-bone"
        >
          {t("cancel")}
        </button>
      </div>
      <p className="mt-2 max-w-xl text-sm text-ash">{t("staffIntro")}</p>

      {/* existing accounts */}
      <ul className="mt-5 space-y-2">
        <li className="flex items-center justify-between gap-3 rounded-xl border border-line/70 px-4 py-3">
          <span className="text-sm text-bone">
            {owner}
            <span className="ml-2 font-condensed text-[0.6rem] uppercase tracking-wider text-blood">
              {t("roleOwner")}
            </span>
          </span>
          <span className="text-xs text-ash-dim">{t("staffFromEnv")}</span>
        </li>
        {staff.map((s) => (
          <li
            key={s.username}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 px-4 py-3"
          >
            <span className="text-sm text-bone">
              {s.username}
              <span className="ml-2 font-condensed text-[0.6rem] uppercase tracking-wider text-ash-dim">
                {t(s.role === "owner" ? "roleOwner" : "roleSupport")}
              </span>
            </span>
            <span className="flex items-center gap-3">
              <span className="text-xs text-ash-dim">
                {s.last_login
                  ? t("staffLastLogin", { date: new Date(s.last_login).toLocaleDateString() })
                  : t("staffNeverIn")}
              </span>
              <button
                type="button"
                onClick={() => remove(s.username)}
                className="font-condensed text-xs uppercase tracking-wider text-blood hover:underline"
              >
                {t("staffRemove")}
              </button>
            </span>
          </li>
        ))}
      </ul>

      {/* add one */}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-line/70 pt-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("staffNamePlaceholder")}
          autoComplete="off"
          className={input}
        />
        <input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          type="password"
          placeholder={t("staffPwPlaceholder", { n: MIN_PASSWORD_LENGTH })}
          autoComplete="new-password"
          className={input}
        />
        <button
          type="button"
          onClick={add}
          disabled={busy || !name.trim() || pw.length < MIN_PASSWORD_LENGTH}
          className="btn btn-primary !px-5 !py-2.5 text-xs disabled:opacity-50"
        >
          {busy ? "…" : t("staffAdd")}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-blood-bright">{error}</p>}
      <p className="mt-2 text-xs text-ash-dim">{t("staffPwNote")}</p>

      {/* what everyone has done */}
      <h3 className="mt-8 font-condensed text-xs font-bold uppercase tracking-widest text-ash">
        {t("auditTitle")}
      </h3>
      {audit.length === 0 ? (
        <p className="mt-3 text-sm text-ash-dim">{t("auditEmpty")}</p>
      ) : (
        <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-line/70">
          <table className="w-full text-left text-xs">
            <tbody>
              {audit.map((a, i) => (
                <tr key={i} className="border-b border-line/40 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 text-ash-dim">
                    {new Date(a.at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-semibold text-bone">{a.actor}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        a.action === "ban" ? "font-semibold text-blood" : "text-ash"
                      }
                    >
                      {a.action}
                    </span>
                  </td>
                  <td className="max-w-[14rem] truncate px-3 py-2 text-ash-dim">
                    {a.target_user ? a.target_user.slice(0, 8) : "—"}{" "}
                    {Object.keys(a.detail || {}).length > 0 && JSON.stringify(a.detail)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
