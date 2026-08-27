"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import { NAME_MAX } from "@/lib/support";

/* Who you are, on the account page: your picture and the name you chose.

   Both are read from the server rather than localStorage. Everything else on
   this page is device state that syncs; these two are account state, and a
   name that appeared on one phone and not another would just look broken. */

interface Me {
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
}

const MAX_MB = 2;

export function ProfileIdentity({ email }: { email: string | null }) {
  const t = useTranslations("profile");
  const [me, setMe] = useState<Me | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Me | null) => {
        if (alive && d) setMe(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function saveName() {
    const next = draft.trim();
    if (!next) return setError(t("nameEmpty"));
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: next }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setMe((m) => (m ? { ...m, displayName: d.displayName } : m));
      setEditing(false);
    } catch {
      setError(t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    if (file.size > MAX_MB * 1024 * 1024) return setError(t("avatarTooBig", { n: MAX_MB }));
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "");
      setMe((m) => (m ? { ...m, avatarUrl: d.avatarUrl } : m));
    } catch (e) {
      /* The bucket is created once by hand; if it is missing, say which thing
         is missing rather than "upload failed". */
      setError(e instanceof Error && e.message === "no_bucket" ? t("avatarNoBucket") : t("avatarFailed"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeAvatar() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMe((m) => (m ? { ...m, avatarUrl: null } : m));
    } catch {
      setError(t("avatarFailed"));
    } finally {
      setBusy(false);
    }
  }

  const shown = me?.email ?? email;

  return (
    <section className="panel mt-8 p-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative shrink-0">
          {me?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a user-uploaded
            // avatar from Supabase Storage; next/image would need a remote pattern
            // for the project host and buys nothing at 56px.
            <img
              src={me.avatarUrl}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-full border border-blood/40 object-cover"
            />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full border border-blood/40 text-blood">
              <Icon name="user" size={26} />
            </div>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            aria-label={t("avatarChange")}
            className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border border-line bg-void text-ash transition-colors hover:border-blood/50 hover:text-blood disabled:opacity-50"
          >
            <Icon name="camera" size={12} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                autoFocus
                maxLength={NAME_MAX}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveName();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="min-w-0 flex-1 border border-line bg-void px-3 py-2 text-base text-bone focus:border-blood focus:outline-none"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveName()}
                className="btn btn-primary !px-4 !py-2 text-xs"
              >
                {t("save")}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn btn-ghost !px-4 !py-2 text-xs"
              >
                {t("cancel")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="truncate text-lg text-bone">
                {me?.displayName ?? t("noName")}
              </p>
              <button
                type="button"
                onClick={() => {
                  setDraft(me?.displayName ?? "");
                  setEditing(true);
                }}
                aria-label={t("nameEdit")}
                className="shrink-0 text-ash-dim transition-colors hover:text-blood"
              >
                <Icon name="edit" size={14} />
              </button>
            </div>
          )}
          <p className="mt-0.5 truncate font-condensed text-xs uppercase tracking-widest text-ash-dim">
            {shown ?? t("noEmail")}
          </p>
          {me?.avatarUrl && !editing && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void removeAvatar()}
              className="mt-1.5 font-condensed text-[0.65rem] uppercase tracking-widest text-ash-dim transition-colors hover:text-blood disabled:opacity-50"
            >
              {t("avatarRemove")}
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-blood">{error}</p>}
    </section>
  );
}
