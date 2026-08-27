/* The RingBornn mark: a crowned glove inside the ring.

   Drawn as vector rather than shipped as the generated PNG. The artwork is
   the master for Instagram and Telegram, where detail is an asset; here it has
   to survive a 32px browser tab, a retina header and a dark background, and a
   raster would be soft in the first two and carry a white box in the third.

   currentColor is deliberately not used — this mark is three fixed brand
   colours plus black keylines, and it must look identical in light and dark
   themes. The heavy outlines are what make it readable when small; thin them
   and it turns to mush at favicon size. */

export const MARK_COLORS = {
  red: "#E30F2A",
  blue: "#2F6BFF",
  gold: "#E8B84B",
  ink: "#0A0B0F",
} as const;

export function BrandMark({
  size = 32,
  className = "",
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}

      {/* the ring — black keyline under a blue band */}
      <circle cx="50" cy="50" r="42" fill="none" stroke={MARK_COLORS.ink} strokeWidth="16" />
      <circle cx="50" cy="50" r="42" fill="none" stroke={MARK_COLORS.blue} strokeWidth="10" />

      {/* glove: knuckle mass, thumb, then the cuff, all over one black keyline */}
      <g stroke={MARK_COLORS.ink} strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M30 70 C30 50 37 42 50 42 C63 42 70 50 70 70 L70 74 L30 74 Z"
          fill={MARK_COLORS.red}
        />
        {/* thumb, tucked on the right so the silhouette stays asymmetric and
            reads as a glove rather than a blob */}
        <path
          d="M70 56 C77 56 80 61 80 66 C80 71 77 74 70 74 Z"
          fill={MARK_COLORS.red}
        />
        <rect x="34" y="74" width="32" height="16" rx="5" fill={MARK_COLORS.red} />
      </g>
      {/* knuckle creases — no stroke, so they vanish rather than smear when tiny */}
      <path d="M43 47 L43 68 M55 45 L55 68" stroke={MARK_COLORS.ink} strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />

      {/* crown, sitting on the knuckles */}
      <g stroke={MARK_COLORS.ink} strokeWidth="4.5" strokeLinejoin="round">
        <path
          d="M31 44 L27 20 L39 30 L50 13 L61 30 L73 20 L69 44 Z"
          fill={MARK_COLORS.gold}
        />
      </g>
      <g fill={MARK_COLORS.gold} stroke={MARK_COLORS.ink} strokeWidth="3.5">
        <circle cx="27" cy="19" r="5" />
        <circle cx="50" cy="12" r="5.5" />
        <circle cx="73" cy="19" r="5" />
      </g>
    </svg>
  );
}
