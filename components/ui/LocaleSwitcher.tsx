"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { LOCALES, LOCALE_COOKIE, localeMeta } from "@/i18n/locales";
import { Icon } from "./Icons";

/* Globe-icon language menu — lists every shipped language by its native name.
   Sets the `locale` cookie and refreshes so the server re-renders translated. */
export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const active = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (code: string) => {
    setOpen(false);
    if (code === active) return;
    document.cookie = `${LOCALE_COOKIE}=${code};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => router.refresh());
  };

  const current = localeMeta(active) ?? LOCALES[0];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-ash transition-colors hover:text-bone disabled:opacity-50"
      >
        <Icon name="globe" size={16} />
        <span className="font-condensed text-xs font-semibold uppercase tracking-wider">
          {current.code}
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-[200] mt-2 max-h-72 w-44 overflow-y-auto rounded-xl border border-line bg-void/95 p-1 shadow-xl backdrop-blur-md"
        >
          {LOCALES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === active}
                onClick={() => pick(l.code)}
                dir={l.rtl ? "rtl" : "ltr"}
                className={[
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  l.code === active
                    ? "bg-blood/10 text-blood"
                    : "text-bone/90 hover:bg-line/40",
                ].join(" ")}
              >
                <span>{l.native}</span>
                <span className="font-condensed text-[0.6rem] uppercase tracking-wider text-ash-dim">
                  {l.code}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
