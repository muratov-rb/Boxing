"use client";

import type { MuscleRegion } from "@/lib/exercises";

/* ===========================================================================
   BodyMap — front + back anatomy silhouettes with per-muscle highlighting.
   The lesson's target muscles glow blood-red; the rest stays neutral. This is
   each lesson's "picture for the specific body part".
   =========================================================================== */

const BASE = "var(--color-line)";
const HOT = "var(--color-blood)";

function fillFor(active: MuscleRegion[], r: MuscleRegion) {
  return active.includes(r) ? HOT : BASE;
}
function opacityFor(active: MuscleRegion[], r: MuscleRegion) {
  return active.includes(r) ? 0.9 : 0.45;
}

export function BodyMap({
  muscles,
  className = "",
}: {
  muscles: MuscleRegion[];
  className?: string;
}) {
  const f = (r: MuscleRegion) => ({
    fill: fillFor(muscles, r),
    opacity: opacityFor(muscles, r),
  });

  return (
    <svg
      viewBox="0 0 220 240"
      className={className}
      role="img"
      aria-label="Targeted muscles"
    >
      {/* ============================== FRONT ============================== */}
      <g transform="translate(10,6)">
        {/* head */}
        <circle cx="45" cy="14" r="11" fill={BASE} opacity="0.35" />
        {/* neck */}
        <rect x="41" y="24" width="8" height="7" rx="2" fill={BASE} opacity="0.35" />

        {/* shoulders (front delts) */}
        <ellipse cx="23" cy="38" rx="9" ry="7" {...f("shoulders")} />
        <ellipse cx="67" cy="38" rx="9" ry="7" {...f("shoulders")} />

        {/* chest */}
        <path d="M31 34 h28 v14 a14 8 0 0 1 -28 0 z" {...f("chest")} />

        {/* biceps (front upper arm) */}
        <rect x="13" y="46" width="10" height="22" rx="5" {...f("biceps")} />
        <rect x="67" y="46" width="10" height="22" rx="5" {...f("biceps")} />

        {/* forearms */}
        <rect x="11" y="70" width="9" height="24" rx="4.5" {...f("forearms")} />
        <rect x="70" y="70" width="9" height="24" rx="4.5" {...f("forearms")} />

        {/* abs */}
        <rect x="36" y="52" width="18" height="26" rx="4" {...f("abs")} />
        {/* obliques */}
        <rect x="29" y="54" width="6" height="22" rx="3" {...f("obliques")} />
        <rect x="55" y="54" width="6" height="22" rx="3" {...f("obliques")} />

        {/* hips */}
        <rect x="31" y="80" width="28" height="10" rx="4" fill={BASE} opacity="0.35" />

        {/* quads */}
        <rect x="31" y="92" width="12" height="34" rx="6" {...f("quads")} />
        <rect x="47" y="92" width="12" height="34" rx="6" {...f("quads")} />

        {/* calves (front view shin) */}
        <rect x="32" y="130" width="10" height="28" rx="5" {...f("calves")} />
        <rect x="48" y="130" width="10" height="28" rx="5" {...f("calves")} />

        {/* feet */}
        <rect x="30" y="160" width="13" height="6" rx="3" fill={BASE} opacity="0.35" />
        <rect x="47" y="160" width="13" height="6" rx="3" fill={BASE} opacity="0.35" />

        <text
          x="45"
          y="182"
          textAnchor="middle"
          fontSize="9"
          fill="var(--color-ash-dim)"
          fontFamily="var(--font-condensed)"
          letterSpacing="2"
        >
          FRONT
        </text>
      </g>

      {/* ============================== BACK =============================== */}
      <g transform="translate(120,6)">
        {/* head */}
        <circle cx="45" cy="14" r="11" fill={BASE} opacity="0.35" />
        <rect x="41" y="24" width="8" height="7" rx="2" fill={BASE} opacity="0.35" />

        {/* traps */}
        <path d="M33 32 h24 l-4 10 h-16 z" {...f("traps")} />

        {/* rear delts */}
        <ellipse cx="23" cy="38" rx="9" ry="7" {...f("shoulders")} />
        <ellipse cx="67" cy="38" rx="9" ry="7" {...f("shoulders")} />

        {/* lats */}
        <path d="M31 44 h10 l3 22 h-9 z" {...f("lats")} />
        <path d="M59 44 h-10 l-3 22 h9 z" {...f("lats")} />

        {/* triceps (back upper arm) */}
        <rect x="13" y="46" width="10" height="22" rx="5" {...f("triceps")} />
        <rect x="67" y="46" width="10" height="22" rx="5" {...f("triceps")} />

        {/* forearms */}
        <rect x="11" y="70" width="9" height="24" rx="4.5" {...f("forearms")} />
        <rect x="70" y="70" width="9" height="24" rx="4.5" {...f("forearms")} />

        {/* lower back */}
        <rect x="38" y="62" width="14" height="16" rx="4" {...f("lowerback")} />

        {/* glutes */}
        <rect x="32" y="80" width="12" height="13" rx="5" {...f("glutes")} />
        <rect x="46" y="80" width="12" height="13" rx="5" {...f("glutes")} />

        {/* hamstrings */}
        <rect x="31" y="95" width="12" height="31" rx="6" {...f("hamstrings")} />
        <rect x="47" y="95" width="12" height="31" rx="6" {...f("hamstrings")} />

        {/* calves */}
        <rect x="32" y="130" width="10" height="28" rx="5" {...f("calves")} />
        <rect x="48" y="130" width="10" height="28" rx="5" {...f("calves")} />

        {/* feet */}
        <rect x="30" y="160" width="13" height="6" rx="3" fill={BASE} opacity="0.35" />
        <rect x="47" y="160" width="13" height="6" rx="3" fill={BASE} opacity="0.35" />

        <text
          x="45"
          y="182"
          textAnchor="middle"
          fontSize="9"
          fill="var(--color-ash-dim)"
          fontFamily="var(--font-condensed)"
          letterSpacing="2"
        >
          BACK
        </text>
      </g>
    </svg>
  );
}
