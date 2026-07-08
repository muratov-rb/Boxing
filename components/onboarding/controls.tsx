"use client";

import { Icon } from "@/components/ui/Icons";

export const cx = (...c: (string | false | undefined)[]) =>
  c.filter(Boolean).join(" ");

export const inputCls =
  "w-full border border-line bg-void px-4 py-3 font-condensed text-base text-bone placeholder:text-ash-dim transition-colors duration-200 focus:border-blood focus:outline-none";

export function Field({
  label,
  htmlFor,
  action,
  children,
}: {
  label: string;
  htmlFor?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* min-h keeps fields aligned whether or not an action is present */}
      <div className="mb-2 flex min-h-[26px] items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="font-condensed text-xs uppercase tracking-widest text-ash"
        >
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  );
}

/* Selectable card used across onboarding steps (single or multi select). */
export function SelectCard({
  active,
  onClick,
  title,
  hint,
  showCheck = true,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
  showCheck?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5",
        active ? "border-blood bg-surface-2" : "border-line hover:border-blood/50",
      )}
    >
      <span className="flex w-full items-center justify-between font-condensed text-sm font-semibold uppercase tracking-wide">
        {title}
        {active && showCheck && (
          <span className="text-blood">
            <Icon name="check" size={15} />
          </span>
        )}
      </span>
      {hint && <span className="mt-0.5 text-xs text-ash-dim">{hint}</span>}
    </button>
  );
}
