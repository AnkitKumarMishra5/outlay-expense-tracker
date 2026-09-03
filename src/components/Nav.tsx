"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Logo from "./Logo";
import SessionTimer from "./SessionTimer";
import ThemeToggle from "./ThemeToggle";
import SoundToggle from "./SoundToggle";
import AboutDialog from "./AboutDialog";
import { APP_BYLINE, APP_NAME } from "@/lib/developer";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/transactions", label: "Transactions" },
  { href: "/statements", label: "Statements" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  const wrapRef = useRef<HTMLElement>(null);
  const [ind, setInd] = useState({ left: 0, width: 0, ready: false });

  const activeHref = LINKS.reduce(
    (best, l) => ((l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)) ? l.href : best),
    ""
  );

  const measure = useCallback(() => {
    const el = wrapRef.current?.querySelector<HTMLAnchorElement>(`[data-href="${activeHref}"]`);
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    else setInd((s) => ({ ...s, ready: false }));
  }, [activeHref]);

  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const shellRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      shellRef.current?.classList.toggle("condensed", window.scrollY > 28);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/onboarding") || pathname.startsWith("/login") || pathname.startsWith("/register")) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-md backdrop-saturate-150">
      <div ref={shellRef} className="navbar-shell mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-2 gap-y-2 px-3 py-3 sm:flex-nowrap sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight">
          <Logo size={26} animate />
          <span className="hidden flex-col leading-none xs:flex sm:flex">
            {APP_NAME}
            <span className="brand-sub mt-1 hidden text-[9.5px] font-normal uppercase tracking-[0.14em] text-muted sm:block">
              {APP_BYLINE}
            </span>
          </span>
        </Link>
        <nav ref={wrapRef} className="relative order-3 flex w-full min-w-0 gap-1 overflow-x-auto text-sm sm:order-none sm:w-auto sm:flex-1">
          {ind.ready && (
            <span
              aria-hidden
              className="nav-pill bottom-0 top-0"
              style={{ transform: `translateX(${ind.left}px)`, width: ind.width }}
            />
          )}
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              data-href={l.href}
              className={`relative z-10 shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 transition-colors sm:px-3 ${
                l.href === activeHref ? "text-ink" : "text-ink2 hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <SessionTimer />
          <SoundToggle />
          <ThemeToggle />
          <AboutDialog />
        </div>
      </div>
    </header>
  );
}
