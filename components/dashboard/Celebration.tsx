"use client";

import { useEffect, useMemo } from "react";
import { Icon, type IconName } from "@/components/ui/Icons";

/* ===========================================================================
   Celebration — full-screen overlay for streak milestones and rank-ups.
   `epic` cranks up the confetti and adds a rotating halo for the big numbers
   (100 / 150 / 250+ streaks, top ranks).
   =========================================================================== */

const COLORS = ["#e30f2a", "#ff8a00", "#2f6bff", "#ffd23f", "#ffffff"];

export function Celebration({
  open,
  title,
  body,
  cta,
  icon = "streak",
  epic = false,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  cta: string;
  icon?: IconName;
  epic?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const confetti = useMemo(
    () =>
      Array.from({ length: epic ? 70 : 34 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * (epic ? 1.4 : 0.8),
        dur: 1.4 + Math.random() * 1.8,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 7,
        round: Math.random() > 0.5,
      })),
    [epic],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      {/* confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {confetti.map((c, i) => (
          <span
            key={i}
            className="animate-confetti absolute top-0"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size * 1.4,
              background: c.color,
              borderRadius: c.round ? "999px" : "2px",
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.dur}s`,
            }}
          />
        ))}
      </div>

      <div
        className="panel animate-pop relative w-full max-w-sm p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          {/* burst rings */}
          <span className="animate-burst absolute inset-0 rounded-full border-2 border-blood" />
          {epic && (
            <span
              className="animate-spin-slow absolute -inset-3 rounded-full border border-dashed border-ember/50"
              aria-hidden="true"
            />
          )}
          <span className="animate-count grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-blood to-ember text-white shadow-lg shadow-blood/30">
            <Icon name={icon} size={40} />
          </span>
        </div>

        <h2 className="animate-count mt-6 font-display text-[clamp(2rem,7vw,3rem)] uppercase leading-none text-blood">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-xs text-sm text-ash">{body}</p>

        <button type="button" onClick={onClose} className="btn btn-primary shine mt-7 w-full">
          {cta}
          <Icon name="bolt" size={16} />
        </button>
      </div>
    </div>
  );
}
