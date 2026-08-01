"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ThemeChoice } from "@/components/ui/ThemeChoice";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { Icon } from "@/components/ui/Icons";
import { PRIMARY_NAV, ACCOUNT_NAV, isActive, type NavItem } from "@/lib/navigation";

/* ===========================================================================
   The app's navigation. One component for every signed-in page.

   Desktop keeps the four daily destinations in the bar and folds the rest into
   an account menu, because a bar with nine links is a wall of text nobody
   reads. Mobile gets a hamburger and a full-height drawer — the same set, just
   somewhere there is room for it.

   Both menus close on route change, on Escape, and on a click outside. Missing
   any one of those is the classic way a menu ends up stuck open over the page
   you just navigated to.
   =========================================================================== */

function NavLink({
  item,
  active,
  onClick,
  showIcon = false,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
  showIcon?: boolean;
}) {
  const t = useTranslations("nav");
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-2.5 font-condensed text-sm uppercase tracking-widest transition-colors ${
        active ? "text-bone" : "text-ash hover:text-bone"
      }`}
    >
      {showIcon && (
        <span className={active ? "text-blood" : "text-ash-dim"}>
          <Icon name={item.icon} size={17} />
        </span>
      )}
      {t(item.key)}
      {/* the active marker grows from the centre rather than appearing */}
      <span
        aria-hidden="true"
        className={`absolute -bottom-1.5 left-0 h-px w-full origin-center bg-blood transition-transform duration-300 motion-reduce:transition-none ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );
}

export function AppNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  /* Both menus remember WHICH route they were opened on, rather than just
     "open". A route change then closes them for free, during render — no
     effect that fires after the new page has already painted underneath an
     open drawer, and nothing to forget when a link is added later. */
  const [drawerOn, setDrawerOn] = useState<string | null>(null);
  const [menuOn, setMenuOn] = useState<string | null>(null);
  const drawer = drawerOn === pathname;
  const menu = menuOn === pathname;
  const setDrawer = (open: boolean) => setDrawerOn(open ? pathname : null);
  const setMenu = (open: boolean) => setMenuOn(open ? pathname : null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* The raw setters, not the setDrawer/setMenu helpers: those close over
       `pathname` and are new on every render, so depending on them would tear
       down and re-add these listeners constantly. */
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOn(null);
        setMenuOn(null);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOn(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  /* A drawer that scrolls the page behind it feels broken on a phone. */
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line/70 bg-void/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Logo />
            <nav aria-label={t("primary")} className="hidden items-center gap-7 lg:flex">
              {PRIMARY_NAV.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <ThemeToggle />
              <LocaleSwitcher />
            </div>

            {/* account menu — desktop only */}
            <div ref={menuRef} className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setMenu(!menu)}
                aria-expanded={menu}
                aria-haspopup="menu"
                className={`grid h-9 w-9 place-items-center rounded-full border transition-colors ${
                  menu ? "border-blood text-blood" : "border-line text-ash hover:text-bone"
                }`}
                aria-label={t("account")}
              >
                <Icon name="user" size={17} />
              </button>
              <div
                role="menu"
                className={`absolute right-0 top-12 w-56 origin-top-right rounded-2xl border border-line bg-void/95 p-2 shadow-xl backdrop-blur-md transition-all duration-200 motion-reduce:transition-none ${
                  menu
                    ? "pointer-events-auto scale-100 opacity-100"
                    : "pointer-events-none scale-95 opacity-0"
                }`}
              >
                {ACCOUNT_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-condensed text-sm uppercase tracking-wider transition-colors ${
                      isActive(pathname, item.href)
                        ? "bg-blood/10 text-blood"
                        : "text-ash hover:bg-line/40 hover:text-bone"
                    }`}
                  >
                    <Icon name={item.icon} size={16} />
                    {t(item.key)}
                  </Link>
                ))}
                <form action="/auth/signout" method="post" className="mt-1 border-t border-line/70 pt-1">
                  <button
                    type="submit"
                    role="menuitem"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-condensed text-sm uppercase tracking-wider text-ash transition-colors hover:bg-line/40 hover:text-blood"
                  >
                    <Icon name="lock" size={16} />
                    {t("signOut")}
                  </button>
                </form>
              </div>
            </div>

            {/* hamburger — everything below desktop */}
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-expanded={drawer}
              aria-label={t("openMenu")}
              className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ash transition-colors hover:border-blood hover:text-blood lg:hidden"
            >
              <Icon name="menu" size={19} />
            </button>
          </div>
        </div>
      </header>

      {/* ---------------------------- mobile drawer --------------------------- */}
      <div
        aria-hidden={!drawer}
        className={`fixed inset-0 z-[60] lg:hidden ${drawer ? "" : "pointer-events-none"}`}
      >
        <button
          type="button"
          tabIndex={drawer ? 0 : -1}
          aria-label={t("closeMenu")}
          onClick={() => setDrawer(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
            drawer ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-[84%] max-w-sm flex-col border-l border-line bg-void transition-transform duration-300 ease-out motion-reduce:transition-none ${
            drawer ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-line/70 px-5">
            <span className="font-condensed text-xs uppercase tracking-[0.25em] text-ash-dim">
              {t("menu")}
            </span>
            <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label={t("closeMenu")}
              className="grid h-9 w-9 place-items-center rounded-xl border border-line text-ash transition-colors hover:border-blood hover:text-blood"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          <nav aria-label={t("primary")} className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {PRIMARY_NAV.map((item) => (
                <li key={item.href}>
                  <DrawerLink
                    item={item}
                    active={isActive(pathname, item.href)}
                    onClick={() => setDrawer(false)}
                  />
                </li>
              ))}
            </ul>

            <p className="mt-6 px-3 font-condensed text-[0.65rem] uppercase tracking-[0.25em] text-ash-dim">
              {t("account")}
            </p>
            <ul className="mt-2 space-y-1">
              {ACCOUNT_NAV.map((item) => (
                <li key={item.href}>
                  <DrawerLink
                    item={item}
                    active={isActive(pathname, item.href)}
                    onClick={() => setDrawer(false)}
                  />
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-line/70 px-5 py-4">
            {/* Explicit three-way choice rather than the icon toggle: on a
                phone there is room to say which theme is actually active. */}
            <ThemeChoice />
            <div className="mt-4 flex items-center gap-3">
              <LocaleSwitcher />
            </div>
            <form action="/auth/signout" method="post" className="mt-3">
              <button type="submit" className="btn btn-ghost w-full !py-2.5 text-xs">
                {t("signOut")}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}

function DrawerLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("nav");
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3.5 rounded-xl px-3 py-3 font-condensed text-base uppercase tracking-wider transition-colors ${
        active ? "bg-blood/10 text-blood" : "text-ash hover:bg-line/40 hover:text-bone"
      }`}
    >
      <Icon name={item.icon} size={19} />
      {t(item.key)}
    </Link>
  );
}
