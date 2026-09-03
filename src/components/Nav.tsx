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
  const [open, setOpen] = useState(false);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      <div ref={shellRef} className="navbar-shell mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight">
          <Logo size={26} animate />
          <span className="hidden flex-col leading-none xs:flex sm:flex">
            {APP_NAME}
            <span className="brand-sub mt-1 hidden text-[9.5px] font-normal uppercase tracking-[0.14em] text-muted sm:block">
              {APP_BYLINE}
            </span>
          </span>
        </Link>
        <nav ref={wrapRef} className="relative hidden min-w-0 flex-1 gap-1 text-sm sm:flex">
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
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="nav-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-lg border border-line p-1.5 text-ink2 transition-colors hover:border-muted hover:text-ink sm:hidden"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              {open ? (
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              ) : (
                <path d="M3.6 7h16.8M3.6 12h16.8M3.6 17h16.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div id="nav-menu" className={`nav-sheet sm:hidden ${open ? "is-open" : ""}`}>
        <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-3 pb-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={l.href === activeHref ? "page" : undefined}
              className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
                l.href === activeHref ? "bg-surface2 text-ink" : "text-ink2 hover:bg-surface2/60 hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
