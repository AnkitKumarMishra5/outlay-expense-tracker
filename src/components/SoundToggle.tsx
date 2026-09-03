"use client";

import { useState, useSyncExternalStore } from "react";
import { setSoundEnabled, soundEnabled, subscribeSound } from "@/lib/sound";

export default function SoundToggle() {
  const [override, setOverride] = useState<boolean | null>(null);
  const stored = useSyncExternalStore(subscribeSound, soundEnabled, () => true);
  const on = override ?? stored;

  function toggle() {
    const next = !on;
    setOverride(next);
    setSoundEnabled(next);
  }

  const label = on ? "Sound on" : "Sound off";

  return (
    <button
      onClick={toggle}
      title={`${label}. Click to change.`}
      aria-label={`${label}. Click to change.`}
      aria-pressed={on}
      className="rounded-lg border border-line p-1.5 text-ink2 transition-colors hover:border-muted hover:text-ink"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 9.4h3.4L12 5.4v13.2l-4.6-4H4a.6.6 0 0 1-.6-.6v-3.6a.6.6 0 0 1 .6-.6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {on ? (
          <path
            d="M15.4 9.2a4 4 0 0 1 0 5.6M18 6.6a7.6 7.6 0 0 1 0 10.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        ) : (
          <path d="M16 9.6l4.6 4.8M20.6 9.6L16 14.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
