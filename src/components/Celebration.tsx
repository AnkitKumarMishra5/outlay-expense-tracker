"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CreditCard from "./CreditCard";
import { inr } from "@/lib/format";
import { play } from "@/lib/sound";
import { Celebration, subscribeCelebrations } from "@/lib/celebrate";

const LIFE = 2100;
const BURST = 22;

function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Mounted once in the layout. Listens for celebrate() and plays a short,
 * self-dismissing flourish: the card, a check stamped over it, a burst of
 * confetti and the amount that was cleared.
 */
export default function CelebrationHost() {
  const [current, setCurrent] = useState<Celebration | null>(null);

  useEffect(() => {
    return subscribeCelebrations((c) => {
      play("settle");
      setCurrent(c);
    });
  }, []);

  useEffect(() => {
    if (!current) return;
    const id = setTimeout(() => setCurrent(null), reduced() ? 1200 : LIFE);
    return () => clearTimeout(id);
  }, [current]);

  if (!current || typeof document === "undefined") return null;

  return createPortal(
    <div className="cele-scrim" role="status" aria-live="polite" onClick={() => setCurrent(null)}>
      <div className="cele-stage" key={current.id}>
        <div className="cele-burst" aria-hidden>
          {Array.from({ length: BURST }, (_, i) => (
            <span
              key={i}
              className="cele-bit"
              style={
                {
                  "--a": `${(360 / BURST) * i + (i % 2 ? 8 : -6)}deg`,
                  "--d": `${118 + (i % 5) * 22}px`,
                  "--t": `${0.85 + (i % 4) * 0.12}s`,
                  "--h": `${(i * 47) % 360}`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        {current.card ? (
          <div className="cele-card">
            <CreditCard bankId={current.card.bankId} label={current.card.label} last4={current.card.last4} />
          </div>
        ) : null}
        <div className="cele-stamp" aria-hidden>
          <svg viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="29" className="cele-stamp-ring" />
            <path d="M19 33.5 28 42l17-19" className="cele-stamp-check" />
          </svg>
        </div>
        <p className="cele-title">
          {current.amount != null && current.amount > 0 ? `${inr(current.amount)} cleared` : "Settled"}
        </p>
        {current.detail && <p className="cele-detail">{current.detail}</p>}
      </div>
    </div>,
    document.body
  );
}
