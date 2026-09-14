"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CreditCard from "./CreditCard";

const STAGES = ["Reading every merchant name", "Working out what each one is", "Writing the corrections back"];
/** The sweep proposes rather than writes, so its last step is different. */
export const REVIEW_STAGES = ["Reading every merchant name", "Working out what each one is", "Gathering what it would change"];

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

/** Cards shown stacked at once. The rest take their turn at the front. */
const DECK_CAP = 3;

const cardKey = (c: OverlayCard) => `${c.bankId}|${c.label}|${c.last4 ?? ""}`;

/**
 * Full-screen "the model is working" panel. With cards it renders them under a
 * scanning beam and streams the merchant names being read: one card on its
 * own, several as a stack whose front card changes in turn. Without any it
 * falls back to the bot. Give it a `key` per run so the stages restart.
 */
export default function AiOverlay({
  kicker,
  title,
  footnote,
  cards = [],
  merchants = [],
  stages = STAGES,
}: {
  kicker: string;
  title: string;
  footnote: string;
  cards?: OverlayCard[];
  merchants?: string[];
  stages?: string[];
}) {
  const [stage, setStage] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [front, setFront] = useState(0);

  useEffect(() => {
    if (cards.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setFront((f) => (f + 1) % cards.length), 1600);
    return () => clearInterval(id);
  }, [cards.length]);

  useEffect(() => {
    const id = setInterval(() => setStage((s) => Math.min(s + 1, stages.length - 1)), 1800);
    return () => clearInterval(id);
  }, [stages.length]);

  useEffect(() => {
    if (merchants.length < 2) return;
    const id = setInterval(() => setCursor((i) => (i + 1) % merchants.length), 340);
    return () => clearInterval(id);
  }, [merchants.length]);

  if (typeof document === "undefined") return null;
  const window3 = merchants.length ? [0, 1, 2].map((k) => merchants[(cursor + k) % merchants.length]) : [];
  const stacked = cards.length > 1;
  const order = cards.map((_, k) => cards[(front + k) % cards.length]);
  const lead = order[0];
  const behind = order.slice(1, DECK_CAP);

  return createPortal(
    <div className="ai-scrim" role="status" aria-live="polite">
      <div className={`ai-panel ${lead ? "ai-panel-wide" : ""}`}>
        {lead ? (
          <>
            <div className={`ai-scan ${stacked ? "ai-scan-deck" : ""}`} aria-hidden>
              {behind
                .map((c, k) => ({ c, depth: k + 1 }))
                .reverse()
                .map(({ c, depth }) => (
                  <div key={cardKey(c)} className="ai-deck-back" style={{ "--depth": depth } as React.CSSProperties}>
                    <CreditCard bankId={c.bankId} label={c.label} last4={c.last4} />
                  </div>
                ))}
              <div key={cardKey(lead)} className={stacked ? "ai-deck-front" : undefined}>
                <div className="ai-scan-card">
                  <CreditCard bankId={lead.bankId} label={lead.label} last4={lead.last4} />
                  <span className="ai-scan-grid" />
                  <span className="ai-scan-beam" />
                  <span className="ai-scan-corner tl" />
                  <span className="ai-scan-corner tr" />
                  <span className="ai-scan-corner bl" />
                  <span className="ai-scan-corner br" />
                </div>
              </div>
              <div className="ai-scan-motes">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} style={{ "--i": i } as React.CSSProperties} />
                ))}
              </div>
            </div>
            {stacked && (
              <p className="ai-deck-caption">
                <span className="truncate">
                  {lead.label}
                  {lead.last4 ? ` •••• ${lead.last4}` : ""}
                </span>
                <span className="text-muted tabular">
                  {front + 1} of {cards.length}
                </span>
                {cards.length > DECK_CAP && <span className="ai-deck-more">+{cards.length - DECK_CAP} more</span>}
              </p>
            )}
          </>
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
          {stages.map((s, i) => (
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
