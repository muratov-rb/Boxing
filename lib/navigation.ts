import type { IconName } from "@/components/ui/Icons";

/* ===========================================================================
   RINGBORNN — one description of the app's shape.

   Every page used to carry its own hand-written header, which is why the links
   in them had drifted apart: some offered "Dashboard", some "Plans", none the
   same set. The nav is defined once here and rendered by one component, so
   adding a page means adding a line rather than editing nine files.

   `primary` is what earns a slot in the desktop bar — the things people do
   daily. Everything else lives behind the account menu on desktop and in the
   drawer on mobile, which is how most apps of this size handle it: a crowded
   top bar is harder to scan than a short one.
   =========================================================================== */

export interface NavItem {
  /** Key into the "nav" message namespace. */
  key: string;
  href: string;
  icon: IconName;
}

/** Daily-use destinations. Shown in the desktop bar and at the top of the drawer. */
export const PRIMARY_NAV: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: "home" },
  { key: "train", href: "/train", icon: "bolt" },
  { key: "lessons", href: "/lessons", icon: "video" },
  { key: "calories", href: "/calories", icon: "calorie" },
];

/** Occasional destinations. Behind the account menu on desktop. */
export const ACCOUNT_NAV: NavItem[] = [
  { key: "profile", href: "/profile", icon: "user" },
  { key: "friends", href: "/friends", icon: "users" },
  { key: "circuits", href: "/circuits", icon: "streak" },
  { key: "nutrition", href: "/nutrition", icon: "nutrition" },
  { key: "plans", href: "/plans", icon: "card" },
];

/** True when `href` is the page being viewed — used for the active marker.
    Exact match only: /lessons must not light up while you are on /login, and
    a prefix test would do exactly that. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
