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
    <span className={`inline-flex items-center gap-2 sm:gap-2.5 ${className}`}>
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
      <span className="font-display text-xl leading-none tracking-wide sm:text-2xl">
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
