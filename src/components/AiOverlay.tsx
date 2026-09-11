"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CreditCard from "./CreditCard";

const STAGES = ["Reading every merchant name", "Working out what each one is", "Writing the corrections back"];

export function BotMark() {
  return (
    <svg viewBox="0 0 48 48" className="ai-bot" fill="none" aria-hidden>
      <rect x="11" y="16" width="26" height="20" rx="7" className="ai-bot-body" />
      <path d="M24 16V9" className="ai-bot-stem" />
      <circle cx="24" cy="7" r="2.6" className="ai-bot-lamp" />
      <circle cx="19" cy="25" r="2.5" className="ai-bot-eye" />
      <circle cx="29" cy="25" r="2.5" className="ai-bot-eye ai-bot-eye-2" />
      <path d="M20 31.5h8" className="ai-bot-mouth" />
      <path d="M11 22H7.5M37 22h3.5" className="ai-bot-arm" />
    </svg>
  );
}

export interface OverlayCard {
  bankId: string;
  label: string;
  last4?: string | null;
}

/**
 * Full-screen "the model is working" panel. With a card it renders the card
 * under a scanning beam and streams the merchant names being read; without
 * one it falls back to the bot. Give it a `key` per run so the stages restart.
 */
export default function AiOverlay({
  kicker,
  title,
  footnote,
  card,
  merchants = [],
}: {
  kicker: string;
  title: string;
  footnote: string;
  card?: OverlayCard | null;
  merchants?: string[];
}) {
  const [stage, setStage] = useState(0);
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (merchants.length < 2) return;
    const id = setInterval(() => setCursor((i) => (i + 1) % merchants.length), 340);
    return () => clearInterval(id);
  }, [merchants.length]);

  if (typeof document === "undefined") return null;
  const window3 = merchants.length ? [0, 1, 2].map((k) => merchants[(cursor + k) % merchants.length]) : [];

  return createPortal(
    <div className="ai-scrim" role="status" aria-live="polite">
      <div className={`ai-panel ${card ? "ai-panel-wide" : ""}`}>
        {card ? (
          <div className="ai-scan" aria-hidden>
            <div className="ai-scan-card">
              <CreditCard bankId={card.bankId} label={card.label} last4={card.last4} />
              <span className="ai-scan-grid" />
              <span className="ai-scan-beam" />
              <span className="ai-scan-corner tl" />
              <span className="ai-scan-corner tr" />
              <span className="ai-scan-corner bl" />
              <span className="ai-scan-corner br" />
            </div>
            <div className="ai-scan-motes">
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} style={{ "--i": i } as React.CSSProperties} />
              ))}
            </div>
          </div>
        ) : (
          <div className="ai-bot-stage" aria-hidden>
            <span className="ai-ring" />
            <span className="ai-ring" />
            <BotMark />
          </div>
        )}
        <p className="ai-kicker">{kicker}</p>
        <p className="mt-1 text-sm font-medium">{title}</p>
        {window3.length > 0 && (
          <div className="ai-ticker" aria-hidden>
            {window3.map((m, k) => (
              <span key={`${cursor}-${k}`} className={`ai-ticker-row r${k}`}>
                <span className="ai-ticker-dot" />
                <span className="truncate">{m}</span>
              </span>
            ))}
          </div>
        )}
        <ul className="ai-stages">
          {STAGES.map((s, i) => (
            <li key={s} className={i < stage ? "done" : i === stage ? "active" : ""}>
              <span className="ai-stage-dot" aria-hidden />
              {s}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-muted">{footnote}</p>
      </div>
    </div>,
    document.body
  );
}
