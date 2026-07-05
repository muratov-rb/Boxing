"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const LOCALES = ["en", "ru"] as const;

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const active = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const pick = (locale: string) => {
    if (locale === active) return;
    document.cookie = `locale=${locale};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <div
      className={`inline-flex border border-line ${className}`}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => pick(l)}
          disabled={pending}
          aria-pressed={l === active}
          className={[
            "px-2 py-1 font-condensed text-xs font-semibold uppercase tracking-wider transition-colors",
            l === active ? "bg-blood text-white" : "text-ash hover:text-bone",
          ].join(" ")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
