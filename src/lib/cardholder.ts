"use client";

import { useSyncExternalStore } from "react";

let holder: string | null = null;
let asked = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Set the name embossed on every card face. The demo uses this for its invented holder. */
export function setCardholder(name: string | null) {
  asked = true;
  holder = name?.trim() ? name.trim() : null;
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  // Fetched once for the whole session rather than threaded through five
  // components. On a public page this 401s and the cards simply go unnamed.
  if (!asked && typeof window !== "undefined") {
    asked = true;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hasProfile && typeof d.name === "string") {
          holder = d.name.trim() || null;
          emit();
        }
      })
      .catch(() => {});
  }
  return () => {
    listeners.delete(l);
  };
}

const snapshot = () => holder;
const serverSnapshot = () => null;

export function useCardholder(): string | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
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
