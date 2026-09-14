"use client";

import { play } from "@/lib/sound";
import { useCallback, useEffect, useRef, useState } from "react";

const HEARTBEAT_THROTTLE_MS = 60_000;
const WARN_MS = 120_000;

function readExpiry(): number | null {
  const match = document.cookie.match(/(?:^|;\s*)outlay_expires_at=(\d+)/);
  return match ? Number(match[1]) : null;
}

export default function SessionTimer() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const lastBeat = useRef(0);
  const locking = useRef(false);

  const signOut = useCallback(
    async (reason: "expired" | "manual") => {
      if (locking.current) return;
      locking.current = true;
      play("lock");
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      // A full load, so no signed-in page survives in the router's cache.
      window.location.replace(reason === "expired" ? "/login?expired=1" : "/login");
    },
    []
  );

  useEffect(() => {
    const tick = () => {
      const expiry = readExpiry();
      if (expiry === null) {
        setRemaining(null);
        return;
      }
      const left = expiry - Date.now();
      setRemaining(left);
      if (left <= 0) signOut("expired");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [signOut]);

  useEffect(() => {
    const beat = () => {
      const now = Date.now();
      if (now - lastBeat.current < HEARTBEAT_THROTTLE_MS) return;
      if (readExpiry() === null) return;
      lastBeat.current = now;
      fetch("/api/auth/session", { method: "POST" }).catch(() => {});
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"];
    events.forEach((e) => window.addEventListener(e, beat, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, beat));
  }, []);

  if (remaining === null) return null;

  const clamped = Math.max(0, remaining);
  const minutes = Math.floor(clamped / 60_000);
  const seconds = Math.floor((clamped % 60_000) / 1000);
  const warning = clamped <= WARN_MS;

  return (
    <div className="flex items-center gap-2">
      <span
        title="You are signed out automatically after this long without activity. Anything you do resets it."
        className={`hidden items-center gap-1.5 rounded-lg border px-2 py-1 text-xs tabular sm:inline-flex ${
          warning ? "pulse-soft border-warn/40 bg-warn/10 text-warn" : "border-line text-ink2"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {minutes}:{String(seconds).padStart(2, "0")}
      </span>
      <button
        onClick={() => signOut("manual")}
        title="Sign out"
        className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs text-ink2 transition-colors hover:border-muted hover:text-ink"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M10 8l-4 4 4 4M6 12h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden xs:inline sm:inline">Sign out</span>
      </button>
    </div>
  );
}
