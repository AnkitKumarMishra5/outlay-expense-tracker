"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Logo from "./Logo";
import { APP_BYLINE, APP_NAME, DEVELOPER } from "@/lib/developer";
import { CONTACT_LINKS, ContactIcon } from "./contactLinks";

export default function AboutDialog() {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="About this app and its developer"
        title="About"
        className="rounded-lg border border-line p-1.5 text-ink2 hover:border-muted hover:text-ink"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 10.8v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="7.6" r="1.15" fill="currentColor" />
        </svg>
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`About ${APP_NAME}`}
        >
          <div className="card rise w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <Logo size={34} />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold tracking-tight">{APP_NAME}</h2>
                <p className="text-xs text-muted">{APP_BYLINE}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg border border-line px-2 py-1 text-sm text-ink2 hover:border-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-ink2">
              Expense tracker, validator and analyser for Indian credit card statements. Derives statement PDF passwords
              from your profile, parses in memory, reconciles totals against the printed figures, and analyses spend
              across every card. Built with Next.js, TypeScript and Postgres.
            </p>

            <div className="mt-4 rounded-xl border border-accent/40 bg-accentSoft p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Meet the developer</p>
              <div className="mt-3 flex items-start gap-3">
                <Image
                  src={DEVELOPER.photo}
                  alt={DEVELOPER.name}
                  width={64}
                  height={64}
                  unoptimized
                  className="shrink-0 rounded-xl border border-line object-cover"
                  style={{ height: 64, width: 64 }}
                />
                <div className="min-w-0">
                  <p className="font-semibold">{DEVELOPER.name}</p>
                  <p className="text-sm text-accent">{DEVELOPER.role}</p>
                  <blockquote className="mt-2 border-l-2 border-accent/60 pl-3 text-[13px] italic leading-relaxed text-ink2">
                    {DEVELOPER.quote}
                  </blockquote>
                </div>
              </div>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                {CONTACT_LINKS.map((l) => (
                  <li key={l.key}>
                    <a
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink2 hover:border-muted hover:text-ink sm:inline-flex sm:w-auto sm:py-1.5"
                    >
                      <ContactIcon name={l.key} />
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-xs text-muted">
              © {new Date().getFullYear()} {DEVELOPER.name}. MIT licensed.{" "}
              <Link href="/privacy" onClick={() => setOpen(false)} className="text-ink2 underline underline-offset-2 hover:text-ink">
                Privacy
              </Link>{" "}
              ·{" "}
              <Link href="/terms" onClick={() => setOpen(false)} className="text-ink2 underline underline-offset-2 hover:text-ink">
                Terms
              </Link>
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
