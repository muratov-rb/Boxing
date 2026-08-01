"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

/* ===========================================================================
   Theme: System · Light · Dark.

   The single sun/moon button was ambiguous — it shows the mode you would
   switch TO, which everyone reads as the mode they are IN. Someone on a dark
   phone saw a moon, assumed they were already in light, and reported that
   light mode looked dark. Three labelled options with the active one marked
   removes the guess entirely, which is what every app people compare us to
   does.

   "System" is the absence of a cookie: the inline script in the layout applies
   the device preference before first paint. Picking Light or Dark writes the
   cookie, and from then on the server renders the class itself.
   =========================================================================== */

type Choice = "system" | "light" | "dark";

const COOKIE = "theme";

/* The cookie is an external store, so it is read through
   useSyncExternalStore rather than copied into state by an effect. The
   snapshot is a plain string, which keeps the comparison cheap and stable. */
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = (): Choice => {
  const m = document.cookie.match(/(?:^|;\s*)theme=(light|dark)/);
  return m ? (m[1] as Choice) : "system";
};
/* During SSR and hydration there is no cookie to read, so nothing is marked
   active until the client snapshot arrives — better than confidently
   highlighting the wrong option. */
const getServerSnapshot = (): Choice => "system";

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeChoice({ className = "" }: { className?: string }) {
  const t = useTranslations("nav");
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const apply = (next: Choice) => {
    const dark = next === "dark" || (next === "system" && systemPrefersDark());
    document.documentElement.classList.toggle("dark", dark);

    if (next === "system") {
      // clearing the cookie hands the decision back to the device
      document.cookie = `${COOKIE}=;path=/;max-age=0;samesite=lax`;
    } else {
      document.cookie = `${COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    }
    for (const l of listeners) l();
  };

  const options: Choice[] = ["system", "light", "dark"];

  return (
    <div className={className}>
      <p className="font-condensed text-[0.65rem] uppercase tracking-[0.25em] text-ash-dim">
        {t("theme")}
      </p>
      <div
        role="radiogroup"
        aria-label={t("theme")}
        className="mt-2 flex rounded-xl border border-line p-1"
      >
        {options.map((o) => {
          const active = choice === o;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => apply(o)}
              className={`flex-1 rounded-lg px-2 py-2 font-condensed text-xs uppercase tracking-wider transition-colors ${
                active
                  ? "bg-blood text-white"
                  : "text-ash hover:bg-line/40 hover:text-bone"
              }`}
            >
              {t(`theme_${o}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
