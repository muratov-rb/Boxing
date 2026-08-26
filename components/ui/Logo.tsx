import Link from "next/link";

/* RINGBORNN wordmark with an angular blood-red mark. */

export function Logo({
  className = "",
  href = "/",
}: {
  className?: string;
  href?: string | null;
}) {
  const content = (
    /* min-w-0 lets the wordmark shrink instead of forcing the header wider
       than the screen. Without it a long CTA label in French or Spanish pushes
       the row past the viewport and the whole page scrolls sideways. */
    <span className={`inline-flex min-w-0 items-center gap-2 sm:gap-2.5 ${className}`}>
      <span className="relative grid h-7 w-7 place-items-center rounded-lg bg-blood sm:h-8 sm:w-8">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 5 6 7-6 7" />
          <path d="m13 5 6 7-6 7" />
        </svg>
      </span>
      {/* Scales with the viewport rather than stepping at one breakpoint. The
          header carries the mark, the wordmark, a language menu and a call to
          action, and the CTA label is three times longer in French than in
          Chinese — the wordmark is the piece with slack in it. Measured: every
          language fits from 360px up; below that this shrinks and truncates
          rather than pushing the page sideways. */}
      <span className="truncate font-display text-[clamp(0.95rem,4.4vw,1.5rem)] leading-none tracking-wide">
        RINGBORNN
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="RingBornn — home" className="inline-flex">
      {content}
    </Link>
  );
}
