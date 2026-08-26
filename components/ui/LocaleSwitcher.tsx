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
  /* The switcher sits in the drawer footer on mobile, where a menu that drops
     downwards lands past the bottom of the screen and can't be read or
     reached. Measure the button and open upwards when there isn't room. */
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

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
        ref={btnRef}
        type="button"
        onClick={() => {
          const rect = btnRef.current?.getBoundingClientRect();
          // 288px ≈ the menu's max height; below that, flip it above the button
          if (rect) setDropUp(window.innerHeight - rect.bottom < 288);
          setOpen((o) => !o);
        }}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        /* 44px tall: this was py-1.5, about 32px, which is below the size a
           thumb reliably hits — and a language switcher that needs two taps
           looks broken rather than fiddly. */
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-line px-3 text-ash transition-colors hover:border-blood/50 hover:text-bone disabled:opacity-50"
      >
        <Icon name="globe" size={17} />
        {/* The code alone, small, told you almost nothing about what was
            selected. The native name is the thing a reader recognises; the
            code stays for the narrowest screens where the name will not fit. */}
        <span className="font-condensed text-sm font-semibold uppercase tracking-wider">
          <span className="hidden sm:inline">{current.native}</span>
          <span className="sm:hidden">{current.code}</span>
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute right-0 z-[200] max-h-72 w-44 overflow-y-auto rounded-xl border border-line bg-void p-1 shadow-xl ${
            dropUp ? "bottom-full mb-2" : "mt-2"
          }`}
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
                  "flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-sm transition-colors",
                  l.code === active
                    ? "bg-blood/10 text-blood"
                    : "text-bone/90 hover:bg-line/40",
                ].join(" ")}
              >
                <span>{l.native}</span>
                {/* A tick, not just a tint. Colour alone is the wrong way to
                    signal the current choice — it is easy to miss and it is
                    invisible to anyone who cannot separate those two reds. */}
                {l.code === active ? (
                  <Icon name="check" size={15} />
                ) : (
                  <span className="font-condensed text-[0.65rem] uppercase tracking-wider text-ash-dim">
                    {l.code}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
