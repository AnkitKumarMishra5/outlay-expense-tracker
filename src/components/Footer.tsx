"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "./Logo";
import { APP_BYLINE, APP_NAME, APP_TAGLINE, DEVELOPER } from "@/lib/developer";
import { CONTACT_LINKS, ContactIcon } from "./contactLinks";
import { useReveal } from "@/lib/useReveal";

export default function Footer() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <footer className="mt-16 border-t border-line">
      <div ref={ref} className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div data-reveal className="flex items-center gap-3">
          <Logo size={30} />
          <div>
            <p className="font-semibold leading-none">{APP_NAME}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">{APP_BYLINE}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-ink2">{APP_TAGLINE}</p>

        <div data-reveal style={{ "--d": "90ms" } as React.CSSProperties} className="card mt-6 max-w-2xl p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Meet the developer</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
            <Image
              src={DEVELOPER.photo}
              alt={DEVELOPER.name}
              width={76}
              height={76}
              unoptimized
              className="shrink-0 rounded-xl border border-line object-cover"
              style={{ height: 76, width: 76 }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold">{DEVELOPER.name}</p>
              <p className="text-sm text-accent">{DEVELOPER.role}</p>
              <blockquote className="mt-2 border-l-2 border-accent/60 pl-3 text-sm italic leading-relaxed text-ink2">
                {DEVELOPER.quote}
              </blockquote>
            </div>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {CONTACT_LINKS.map((l) => (
              <li key={l.key}>
                <a
                  href={l.href}
                  aria-label={`${l.label}: ${l.detail}`}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? (l.key === "site" ? "noopener" : "noopener noreferrer") : undefined}
                  className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink2 transition-colors hover:border-muted hover:text-ink sm:inline-flex sm:w-auto sm:py-1.5"
                >
                  <ContactIcon name={l.key} />
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p data-reveal style={{ "--d": "170ms" } as React.CSSProperties} className="mt-8 text-xs text-muted">
          © {new Date().getFullYear()} {DEVELOPER.name}. Only you can see your statements. MIT licensed.{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy</Link> ·{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-ink">Terms</Link>
        </p>
      </div>
    </footer>
  );
}
