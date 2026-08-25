"use client";

import { useEffect, useState } from "react";

/* A single dial: how much of one nutrient you have had against the day's goal.

   The sweep is animated by transitioning stroke-dashoffset, which the compositor
   can handle on its own — the alternative, re-rendering the arc on every frame,
   is exactly the kind of thing that made the phone build feel sticky. */

export interface NutrientRingProps {
  label: string;
  value: number;
  target: number;
  unit: string;
  /** A CSS colour (usually a token) for the filled arc. */
  color: string;
  /** Limits count UP to a ceiling — going over is bad, not an achievement. */
  isLimit?: boolean;
  /** Milliseconds to stagger the sweep, so a row of rings fills in sequence. */
  delay?: number;
  size?: number;
}

export function NutrientRing({
  label,
  value,
  target,
  unit,
  color,
  isLimit = false,
  delay = 0,
  size = 76,
}: NutrientRingProps) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const over = isLimit && value > target;

  /* Start empty and fill on mount. Without the two-pass state the arc renders
     already-complete and the motion never happens. */
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setShown(pct), 60 + delay);
    return () => clearTimeout(id);
  }, [pct, delay]);

  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - shown / 100);
  const arcColor = over ? "var(--color-blood-bright)" : color;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          /* Start the sweep at 12 o'clock rather than 3. */
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={arcColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 900ms cubic-bezier(.22,.9,.3,1), stroke 300ms",
            }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center">
          <span
            className={`font-display text-base leading-none ${
              over ? "text-blood-bright" : "text-bone"
            }`}
          >
            {Math.round(value)}
          </span>
        </span>
      </div>

      <span className="mt-2 font-condensed text-[0.65rem] uppercase tracking-widest text-ash">
        {label}
      </span>
      <span className="mt-0.5 text-[0.65rem] text-ash-dim">
        {isLimit ? "≤" : "/"} {Math.round(target)}
        {unit}
      </span>
    </div>
  );
}

/* Reduced-motion users get the same numbers without the sweep — the ring is
   information, the animation is decoration. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}
