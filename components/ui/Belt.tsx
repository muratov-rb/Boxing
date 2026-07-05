/* Championship belt mark — used in the analysis reveal and dashboard. */

export function Belt({
  className = "h-auto w-full max-w-sm",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 420 150"
      className={className}
      role="img"
      aria-label="Championship belt"
    >
      <defs>
        <linearGradient id="belt-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-ember)" />
          <stop offset="1" stopColor="var(--color-blood)" />
        </linearGradient>
      </defs>

      {/* straps */}
      {[
        [20, 52],
        [250, 52],
      ].map(([x, y]) => (
        <g key={x}>
          <rect
            x={x}
            y={y}
            width="150"
            height="46"
            rx="4"
            fill="var(--color-surface-2)"
            stroke="var(--color-line)"
          />
          <rect
            x={x + 6}
            y={y + 6}
            width="138"
            height="34"
            rx="2"
            fill="none"
            stroke="var(--color-ash-dim)"
            strokeOpacity="0.5"
            strokeDasharray="3 5"
          />
        </g>
      ))}

      {/* medallion */}
      <circle cx="210" cy="75" r="44" fill="url(#belt-ring)" />
      <circle
        cx="210"
        cy="75"
        r="35"
        fill="var(--color-charcoal)"
        stroke="var(--color-ember)"
        strokeOpacity="0.4"
      />
      <path
        d="M210 51 L215.6 67.2 L232.8 67.6 L219.1 78 L224.1 94.4 L210 84.6 L195.9 94.4 L200.9 78 L187.2 67.6 L204.4 67.2 Z"
        fill="var(--color-bone)"
      />
    </svg>
  );
}
