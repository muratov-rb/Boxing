import type { SVGProps } from "react";

/* Lightweight inline icon set (stroke style, currentColor). */

export type IconName =
  | "plan"
  | "belt"
  | "streak"
  | "video"
  | "nutrition"
  | "calorie"
  | "technique"
  | "rest"
  | "target"
  | "gloves"
  | "bolt"
  | "arrow"
  | "lock"
  | "check"
  | "telegram"
  | "instagram"
  | "globe";

const PATHS: Record<IconName, React.ReactNode> = {
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
    </>
  ),
  plan: (
    <>
      <path d="M4 5h16" />
      <path d="M4 12h10" />
      <path d="M4 19h7" />
      <path d="m16 15 2 2 4-4" />
    </>
  ),
  belt: (
    <>
      <path d="M6 4h12v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6z" />
      <path d="M4 7H2m4 0H4m18 0h-2m2 0h-2" />
      <path d="M12 15v5" />
      <path d="M8 20h8" />
    </>
  ),
  streak: (
    <>
      <path d="M12 3c1 3-1 4-1 6a3 3 0 0 0 6 .5c1.5 2 1 4 1 5a6 6 0 1 1-11-3c1-2 3-2 3-5 0-2 1-3 2-3.5z" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m10 9 5 3-5 3z" />
    </>
  ),
  nutrition: (
    <>
      <path d="M12 8c0-2 1.5-4 4-4 .5 2.5-1 4.5-4 4" />
      <path d="M12 8c-1-2-3-3-5-2.5C7 8 9 9 12 8z" />
      <path d="M6 12a6 6 0 0 0 12 0c0-1-1-2-3-2H9c-2 0-3 1-3 2z" />
    </>
  ),
  calorie: (
    <>
      <path d="M4 14a8 8 0 0 1 16 0" />
      <path d="M12 14l4-3" />
      <path d="M4 18h16" />
    </>
  ),
  technique: (
    <>
      <path d="M12 3 5 6v5c0 4 3 7 7 8 4-1 7-4 7-8V6z" />
      <path d="m9 11 2 2 4-4" />
    </>
  ),
  rest: (
    <>
      <path d="M20 14A8 8 0 0 1 10 4a7 7 0 1 0 10 10z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  gloves: (
    <>
      <path d="M7 11a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4z" />
      <path d="M7 12H5.5a1.5 1.5 0 0 1 0-3H7" />
      <path d="M9 17v2a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-2" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  check: (
    <>
      <path d="m5 12 4 4 10-10" />
    </>
  ),
  telegram: (
    <>
      <path d="m21 4-3 15.5-6.2-4.6L8.6 19l-.9-5.4L21 4z" />
      <path d="M21 4 3.5 10.8l4.2 2.8" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="16.8" cy="7.2" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
