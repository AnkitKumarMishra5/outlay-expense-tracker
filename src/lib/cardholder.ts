"use client";

import { createContext, createElement, useContext, useSyncExternalStore, type ReactNode } from "react";

// The signed-in person's own name, and nothing else. The public demo's
// invented holder lives in DemoCardholder below, scoped to the demo's own
// subtree, so it can never leak onto a real account's cards.
let holder: string | null = null;
let inFlight = false;
let resolved = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function hasSession(): boolean {
  const match = document.cookie.match(/(?:^|;\s*)outlay_expires_at=(\d+)/);
  return match ? Number(match[1]) > Date.now() : false;
}

function load() {
  if (inFlight || typeof window === "undefined" || !hasSession()) return;
  inFlight = true;
  fetch("/api/profile")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const name = d?.hasProfile && typeof d.name === "string" ? d.name.trim() : "";
      holder = name || null;
      // A new account has no profile until onboarding saves one; leave the
      // door open so the next card to mount asks again instead of staying blank.
      resolved = Boolean(name);
      emit();
    })
    .catch(() => {})
    .finally(() => {
      inFlight = false;
    });
}

/** Re-read the name after the profile changes (onboarding, settings). */
export function refreshCardholder() {
  resolved = false;
  load();
}

function subscribe(l: () => void) {
  listeners.add(l);
  // Fetched once for the whole session rather than threaded through five
  // components. Signed out, nothing is asked and the cards go unnamed.
  if (!resolved) load();
  return () => {
    listeners.delete(l);
  };
}

const snapshot = () => holder;
const serverSnapshot = () => null;

const DemoName = createContext<string | null>(null);

/** Names every card inside it with an invented holder. The public demo only. */
export function DemoCardholder({ name, children }: { name: string; children: ReactNode }) {
  return createElement(DemoName.Provider, { value: name }, children);
}

export function useCardholder(): string | null {
  const demo = useContext(DemoName);
  const own = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return demo ?? own;
}

/**
 * Fit a name into the space a card actually has, the way an issuer would.
 *
 * A card is embossed, not wrapped: it gets one line. Anything too long loses
 * its middle names to initials first, then falls back to an initial plus the
 * surname, and only truncates when even that will not fit.
 */
export function formatHolder(raw: string, maxChars = 24): string {
  const name = raw.trim().replace(/\s+/g, " ").toUpperCase();
  if (!name) return "";
  if (name.length <= maxChars) return name;

  const parts = name.split(" ");
  if (parts.length > 2) {
    const initialled = [parts[0], ...parts.slice(1, -1).map((p) => p[0]), parts[parts.length - 1]].join(" ");
    if (initialled.length <= maxChars) return initialled;

    const tight = `${parts[0][0]} ${parts[parts.length - 1]}`;
    if (tight.length <= maxChars) return tight;
  }
  if (parts.length === 2) {
    const tight = `${parts[0][0]} ${parts[1]}`;
    if (tight.length <= maxChars) return tight;
  }
  return `${name.slice(0, maxChars - 1).trimEnd()}…`;
}
