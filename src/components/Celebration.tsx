"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CreditCard from "./CreditCard";
import { inr } from "@/lib/format";
import { play } from "@/lib/sound";
import { Celebration, subscribeCelebrations } from "@/lib/celebrate";

const LIFE = 2600;
const REDUCED_LIFE = 1500;

/** The balance runs down while the light rakes across the card. */
const COUNT_START = 700;
const COUNT_FOR = 820;

function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * One settle, mounted fresh per celebration so its counter starts from the
 * balance being cleared. The card drops in and lands with its shadow
 * tightening under it, a specular highlight rakes across the face, and the
 * outstanding balance runs down to nothing as it passes.
 */
function Settle({ item, onDone }: { item: Celebration; onDone: () => void }) {
  const owed = Math.max(0, Number(item.amount ?? 0));
  const [still] = useState(reduced);
  const counts = !still && owed > 0;
  const [shown, setShown] = useState(() => (counts ? owed : 0));
  const frame = useRef<number | undefined>(undefined);
  // Read the label off the figure, so it can never say "Clearing" over a zero.
  const cleared = Math.round(shown) <= 0;

  useEffect(() => {
    const dismiss = setTimeout(onDone, still ? REDUCED_LIFE : LIFE);
    if (counts) {
      const started = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, Math.max(0, (t - started - COUNT_START) / COUNT_FOR));
        // Ease out, so the last rupees fall away rather than stopping dead.
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(owed * (1 - eased));
        if (p < 1) frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    }
    return () => {
      clearTimeout(dismiss);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [counts, owed, still, onDone]);

  return (
    <div className="stl-stage">
      <div className="stl-deck">
        <span className="stl-shadow" aria-hidden />
        <div className="stl-card">
          {item.card ? <CreditCard bankId={item.card.bankId} label={item.card.label} last4={item.card.last4} /> : null}
          <span className="stl-rake" aria-hidden />
          <span className="stl-rake stl-rake-2" aria-hidden />
          <span className="stl-bloom" aria-hidden />
        </div>
      </div>

      <p className={`stl-eyebrow ${cleared ? "is-clear" : ""}`}>{cleared ? "Settled" : "Clearing"}</p>
      <p className="stl-figure tabular">{owed > 0 ? inr(Math.round(shown)) : "Settled"}</p>
      {item.card && (
        <p className="stl-card-line">
          {item.card.label} <span className="stl-dim">•••• {item.card.last4 ?? "????"}</span>
        </p>
      )}
      {item.detail && <p className="stl-detail">{item.detail}</p>}
    </div>
  );
}

/** Mounted once in the layout. Listens for celebrate() and plays the settle. */
export default function CelebrationHost() {
  const [current, setCurrent] = useState<Celebration | null>(null);

  useEffect(() => {
    return subscribeCelebrations((c) => {
      play("settle");
      setCurrent(c);
    });
  }, []);

  if (!current || typeof document === "undefined") return null;

  return createPortal(
    <div className="stl-scrim" role="status" aria-live="polite" onClick={() => setCurrent(null)}>
      <Settle key={current.id} item={current} onDone={() => setCurrent(null)} />
    </div>,
    document.body
  );
}
