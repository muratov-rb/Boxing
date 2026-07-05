"use client";

import { useTranslations } from "next-intl";
import { PATHS } from "@/lib/onboarding";
import type { Profile, ProfileAction } from "@/lib/onboarding";
import { Icon } from "@/components/ui/Icons";

export function PathSelector({
  profile,
  dispatch,
  onNext,
}: {
  profile: Profile;
  dispatch: React.Dispatch<ProfileAction>;
  onNext: () => void;
}) {
  const t = useTranslations("onb");
  const tp = useTranslations("paths");

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="text-center">
        <p className="kicker justify-center">{t("pathKicker")}</p>
        <h1 className="mt-4 font-display text-[clamp(2.1rem,6vw,3.75rem)] uppercase leading-none">
          {t("pathTitlePre")}
          <span className="text-blood">{t("pathTitleAccent")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-ash">{t("pathSub")}</p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {PATHS.map((p) => {
          const selected = profile.path === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => dispatch({ type: "patch", patch: { path: p.id } })}
              aria-pressed={selected}
              className={[
                "group relative flex flex-col p-7 text-left transition-all duration-200",
                selected
                  ? "border border-blood bg-surface-2 shadow-[0_0_44px_-10px_rgba(224,16,41,0.5)]"
                  : "panel hover:border-blood/50",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span className="badge">{tp(`${p.id}Tag`)}</span>
                <span
                  className={[
                    "grid h-6 w-6 place-items-center border transition-colors",
                    selected
                      ? "border-blood bg-blood text-white"
                      : "border-line text-transparent",
                  ].join(" ")}
                >
                  <Icon name="check" size={14} />
                </span>
              </div>

              <h2 className="mt-5 font-condensed text-2xl font-bold uppercase tracking-wide">
                {tp(`${p.id}Label`)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ash">
                {tp(`${p.id}Blurb`)}
              </p>

              <ul className="mt-5 space-y-2 border-t border-line/70 pt-5">
                {[1, 2, 3].map((n) => (
                  <li
                    key={n}
                    className="flex items-center gap-2.5 text-sm text-bone/90"
                  >
                    <span className="text-blood">
                      <Icon name="check" size={16} />
                    </span>
                    {tp(`${p.id}P${n}`)}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex justify-end">
        <button
          type="button"
          disabled={!profile.path}
          onClick={onNext}
          className="btn btn-primary"
        >
          {t("continue")}
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
