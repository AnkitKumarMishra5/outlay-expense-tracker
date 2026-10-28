"use client";

import { Reorder, useDragControls } from "motion/react";
import { useEffect, useRef } from "react";
import { CardRow } from "@/lib/types";

/**
 * Cards the cardholder can put in their own order, by dragging the grip or with
 * the arrow keys on it. The order is saved once a card is dropped, and every
 * list of cards follows it.
 */
export default function CardOrderList({
  cards,
  onArrange,
  onSave,
  children,
}: {
  cards: CardRow[];
  onArrange: (next: CardRow[]) => void;
  onSave: (next: CardRow[]) => void;
  children: (card: CardRow) => React.ReactNode;
}) {
  // Drag events fire after the last reorder render, so the latest order is read from here.
  const latest = useRef(cards);
  useEffect(() => {
    latest.current = cards;
  }, [cards]);

  const move = (index: number, by: number) => {
    const to = index + by;
    if (to < 0 || to >= cards.length) return;
    const next = [...cards];
    const [card] = next.splice(index, 1);
    next.splice(to, 0, card);
    onArrange(next);
    onSave(next);
  };

  return (
    <Reorder.Group as="ul" axis="y" values={cards} onReorder={onArrange} className="space-y-2">
      {cards.map((card, i) => (
        <Item key={card.id} card={card} onDrop={() => onSave(latest.current)} onMove={(by) => move(i, by)}>
          {children(card)}
        </Item>
      ))}
    </Reorder.Group>
  );
}

function Item({
  card,
  onDrop,
  onMove,
  children,
}: {
  card: CardRow;
  onDrop: () => void;
  onMove: (by: number) => void;
  children: React.ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={card}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      whileDrag={{ scale: 1.01, boxShadow: "0 10px 28px rgba(0, 0, 0, 0.35)" }}
      className="relative flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-3 text-sm"
    >
      <button
        type="button"
        aria-label={`Move ${card.card_label}. Drag, or use the up and down arrow keys.`}
        title="Drag to arrange"
        onPointerDown={(e) => controls.start(e)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            onMove(e.key === "ArrowUp" ? -1 : 1);
          }
        }}
        className="-ml-1 cursor-grab touch-none rounded p-1 text-muted transition-colors hover:text-ink2 active:cursor-grabbing"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden>
          <circle cx="3.5" cy="3" r="1.4" />
          <circle cx="8.5" cy="3" r="1.4" />
          <circle cx="3.5" cy="8" r="1.4" />
          <circle cx="8.5" cy="8" r="1.4" />
          <circle cx="3.5" cy="13" r="1.4" />
          <circle cx="8.5" cy="13" r="1.4" />
        </svg>
      </button>
      {children}
    </Reorder.Item>
  );
}
