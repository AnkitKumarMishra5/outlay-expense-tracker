"use client";

import { play } from "@/lib/sound";
import { useState, useSyncExternalStore } from "react";

type Mode = "light" | "dark" | "system";

function apply(mode: Mode) {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
  try {
    localStorage.setItem("outlay-theme", mode);
  } catch {}
}

function storedMode(): Mode {
  try {
    const value = localStorage.getItem("outlay-theme");
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {}
  return "system";
}

const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export default function ThemeToggle() {
  const [override, setOverride] = useState<Mode | null>(null);
  const initial = useSyncExternalStore(subscribe, storedMode, () => "system" as Mode);
  const mode = override ?? initial;

  function cycle() {
    const next: Mode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    setOverride(next);
    apply(next);
    play("tick");
    listeners.forEach((fn) => fn());
  }

  const label = mode === "system" ? "System theme" : mode === "light" ? "Light theme" : "Dark theme";

  return (
    <button
      onClick={cycle}
      title={`${label}. Click to change.`}
      aria-label={`${label}. Click to change.`}
      className="rounded-lg border border-line p-1.5 text-ink2 transition-transform duration-300 hover:border-muted hover:text-ink hover:rotate-[18deg] active:rotate-[-14deg]"
    >
      {mode === "light" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ) : mode === "dark" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="2.6" y="4.4" width="18.8" height="13" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.5 20.6h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
