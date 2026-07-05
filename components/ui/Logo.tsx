import Link from "next/link";

/* PRESSURE wordmark with an angular blood-red mark. */

export function Logo({
  className = "",
  href = "/",
}: {
  className?: string;
  href?: string | null;
}) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center bg-blood">
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
      <span className="font-display text-2xl leading-none tracking-wide">
        PRESSURE
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="Pressure — home" className="inline-flex">
      {content}
    </Link>
  );
}
