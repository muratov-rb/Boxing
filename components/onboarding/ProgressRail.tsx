import { Icon } from "@/components/ui/Icons";

/* Boxing "round" indicator for the onboarding steps. */

export function ProgressRail({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="border-b border-line/70 bg-charcoal/60">
      <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 px-6 py-5 sm:gap-4">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={label} className="flex flex-1 items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2.5">
                <span
                  className={[
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full border font-condensed text-sm font-bold transition-colors",
                    done
                      ? "border-blood bg-blood text-white"
                      : active
                        ? "border-blood text-blood"
                        : "border-line text-ash-dim",
                  ].join(" ")}
                >
                  {done ? (
                    <Icon name="check" size={16} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <span
                  className={[
                    "hidden font-condensed text-xs uppercase tracking-[0.18em] sm:block",
                    active ? "text-bone" : done ? "text-ash" : "text-ash-dim",
                  ].join(" ")}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={[
                    "h-px flex-1 transition-colors",
                    done ? "bg-blood/60" : "bg-line",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
