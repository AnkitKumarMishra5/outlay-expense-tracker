"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import CreditCard from "./CreditCard";
import CardBack from "./CardBack";
import ConfirmDelete from "./ConfirmDelete";
import { CardRow } from "@/lib/types";
import { bankById } from "@/lib/banks";
import Link from "next/link";
import { play } from "@/lib/sound";
import { inr } from "@/lib/format";

export interface CardStat {
  debits: number;
  txns: number;
  nextDue: string | null;
  nextDueAmount: number | null;
}

type SortMode = "bank" | "spend" | "due" | "name";

const SORTS: { value: SortMode; label: string }[] = [
  { value: "bank", label: "Bank" },
  { value: "spend", label: "Most spent" },
  { value: "due", label: "Due date" },
  { value: "name", label: "A to Z" },
];

export interface RangeStats {
  rangeLabel: string;
  debits: number;
  credits: number;
  fees: number;
  txns: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function daysUntil(day: string) {
  const d = new Date(`${day}T00:00:00`);
  return Math.round((d.getTime() - Date.now()) / 86_400_000);
}

function dueLabel(day: string) {
  const days = daysUntil(day);
  if (days < 0) return `overdue by ${Math.abs(days)}d`;
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  if (days <= 6) return `due in ${days}d`;
  const d = new Date(`${day}T00:00:00`);
  return `due ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function CardRail({
  cards,
  activeId,
  onSelect,
  stats,
  cardStats,
  onCardsChanged,
}: {
  cards: CardRow[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  stats?: RangeStats | null;
  cardStats?: Record<string, CardStat>;
  onCardsChanged?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("spend");
  const [flipped, setFlipped] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CardRow | null>(null);
  const prevRects = useRef(new Map<string, DOMRect>());
  const flipPending = useRef(false);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const active = cards.find((c) => c.id === activeId) ?? null;

  const topCard = useMemo(() => {
    if (!cards.length) return null;
    return [...cards].sort(
      (a, b) => (cardStats?.[b.id]?.debits ?? 0) - (cardStats?.[a.id]?.debits ?? 0)
    )[0];
  }, [cards, cardStats]);

  const hero = active ?? topCard;

  const rest = useMemo(
    () => (hero ? cards.filter((c) => c.id !== hero.id).slice(0, 2) : []),
    [cards, hero]
  );

  const peak = useMemo(
    () => Math.max(1, ...cards.map((c) => cardStats?.[c.id]?.debits ?? 0)),
    [cards, cardStats]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = cards.filter(
      (c) =>
        !q ||
        c.card_label.toLowerCase().includes(q) ||
        c.bank_name.toLowerCase().includes(q) ||
        (c.last4 ?? "").includes(q)
    );
    const copy = [...list];
    copy.sort((a, b) => {
      const sa = cardStats?.[a.id];
      const sb = cardStats?.[b.id];
      switch (sort) {
        case "spend":
          return (sb?.debits ?? 0) - (sa?.debits ?? 0) || a.card_label.localeCompare(b.card_label);
        case "due": {
          const da = sa?.nextDue ?? "";
          const db = sb?.nextDue ?? "";
          if (da && db) return da.localeCompare(db) || a.card_label.localeCompare(b.card_label);
          if (da) return -1;
          if (db) return 1;
          return a.card_label.localeCompare(b.card_label);
        }
        case "name":
          return a.card_label.localeCompare(b.card_label);
        case "bank":
        default:
          return (
            bankById(a.bank_id).name.localeCompare(bankById(b.bank_id).name) ||
            a.card_label.localeCompare(b.card_label)
          );
      }
    });
    return copy;
  }, [cards, cardStats, query, sort]);

  useLayoutEffect(() => {
    const shouldAnimate = flipPending.current && !reduced();
    flipPending.current = false;
    const moved: { el: HTMLLIElement; dy: number }[] = [];
    visible.forEach((c) => {
      const el = rowRefs.current.get(c.id);
      const before = prevRects.current.get(c.id);
      if (!el || !before) return;
      const dy = before.top - el.getBoundingClientRect().top;
      if (Math.abs(dy) > 1) moved.push({ el, dy });
    });
    if (shouldAnimate)
      moved.forEach(({ el, dy }, i) => {
        el.animate(
          [
            { transform: `translateY(${dy}px)`, opacity: 0.55 },
            { transform: `translateY(${dy * 0.12}px)`, opacity: 1, offset: 0.7 },
            { transform: "none", opacity: 1 },
          ],
          { duration: 460, easing: "cubic-bezier(0.22, 1, 0.36, 1)", delay: Math.min(i, 12) * 22 }
        );
      });
    const next = new Map<string, DOMRect>();
    visible.forEach((c) => {
      const el = rowRefs.current.get(c.id);
      if (el) next.set(c.id, el.getBoundingClientRect());
    });
    prevRects.current = next;
  }, [visible]);

  function changeSort(nextSort: SortMode) {
    if (nextSort === sort) return;
    const snapshot = new Map<string, DOMRect>();
    visible.forEach((c) => {
      const el = rowRefs.current.get(c.id);
      if (el) snapshot.set(c.id, el.getBoundingClientRect());
    });
    prevRects.current = snapshot;
    flipPending.current = true;
    setSort(nextSort);
  }

  function pick(id: string) {
    setFlipped(false);
    play("select");
    onSelect(id === activeId ? null : id);
  }

  return (
    <div className="card p-4">
      {pendingDelete && (
        <ConfirmDelete
          card={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onDeleted={() => {
            setPendingDelete(null);
            onSelect(null);
            onCardsChanged?.();
          }}
        />
      )}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink2">
          Cards <span className="text-muted">· {cards.length}</span>
        </h2>
        {active && (
          <span className="flex items-center gap-1">
            <button onClick={() => onSelect(null)} className="rounded-md px-2 py-1 text-xs text-accent hover:bg-accent/10">
              Show all
            </button>
            <button
              onClick={() => setPendingDelete(active)}
              className="rounded-md px-2 py-1 text-xs text-muted hover:bg-bad/10 hover:text-bad"
            >
              Remove
            </button>
          </span>
        )}
      </div>

      {hero && (
        <div className="mb-4">
          <div className="deck-clip">
          <div className={`deck ${cards.length >= 3 ? "deck-deal" : ""}`}>
          {rest.map((c, i) => (
            <div key={c.id} className={`deck-rest deck-rest-${i + 1}`} aria-hidden>
              <CreditCard bankId={c.bank_id} label={c.card_label} last4={c.last4} />
            </div>
          ))}
          <div key={hero.id} className="deck-top">
            <button
              onClick={() => {
                if (active) {
                  play("flip");
                  setFlipped((f) => !f);
                } else {
                  pick(hero.id);
                }
              }}
              className="flip-scene block w-full text-left"
              aria-label={active ? (flipped ? "Show card front" : "Show card details") : `Filter to ${hero.card_label}`}
            >
              <div className={`flip-inner ${flipped ? "flipped" : ""}`}>
                <div className="flip-front">
                  <CreditCard bankId={hero.bank_id} label={hero.card_label} last4={hero.last4} tilt={!flipped} />
                </div>
                <div className="flip-back">
                  <CardBack bankId={hero.bank_id} label={hero.card_label} last4={hero.last4} stats={stats} />
                </div>
              </div>
            </button>
            </div>
          </div>
          </div>
          <p className="mt-1.5 text-center text-[10px] uppercase tracking-widest text-muted">
            {active ? (flipped ? "click to flip back" : "click card for period figures") : "most spent this period"}
          </p>
        </div>
      )}

      {cards.length > 1 && (
      <div className="mb-3 flex flex-wrap gap-1">
        {SORTS.map((option) => (
          <button
            key={option.value}
            onClick={() => changeSort(option.value)}
            aria-pressed={sort === option.value}
            className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
              sort === option.value
                ? "border-accent bg-accentSoft text-accent"
                : "border-line text-ink2 hover:border-muted"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      )}

      {cards.length > 8 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards…"
          className="mb-3 w-full rounded-lg border border-line bg-surface2 px-3 py-1.5 text-xs outline-none placeholder:text-muted focus:border-accent"
        />
      )}

      {cards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="card-ghost" aria-hidden>
            <span className="card-ghost-plus">+</span>
          </span>
          <p className="text-sm font-medium">No cards yet</p>
          <p className="max-w-[15rem] text-xs text-ink2">
            Drop a statement and Outlay reads the issuer and last four digits off the PDF, then offers to add the card
            for you.
          </p>
          <Link
            href="/upload"
            className="rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            Upload a statement
          </Link>
          <Link href="/settings" className="text-xs text-accent hover:underline">
            or add a card by hand
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted">No cards match “{query}”.</p>
      ) : (
        <ul className="max-h-[420px] space-y-1 overflow-y-auto overflow-x-hidden pr-1">
          {visible.map((c, i) => {
            const bank = bankById(c.bank_id);
            const stat = cardStats?.[c.id];
            const spend = stat?.debits ?? 0;
            const isActive = c.id === activeId;
            const due = stat?.nextDue ?? null;
            const left = due ? daysUntil(due) : null;
            const dueTone = left === null ? "" : left < 0 ? "text-bad font-medium" : left <= 2 ? "text-bad" : left <= 7 ? "text-warn" : "text-ink2";
            const txnText = stat?.txns ? `${stat.txns} txn${stat.txns === 1 ? "" : "s"}` : "no spend";
            const share = peak > 0 ? Math.round((spend / peak) * 100) : 0;
            const title = [
              spend > 0 ? `${inr(spend)} spent, ${share}% of your highest card` : "No spend this period",
              spend > 0 ? txnText : null,
              due ? `${stat?.nextDueAmount != null ? inr(stat.nextDueAmount) : "Payment"} ${dueLabel(due)}` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={c.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(c.id, el);
                  else rowRefs.current.delete(c.id);
                }}
                className="spine-in"
                style={{ "--d": `${Math.min(i, 14) * 40}ms` } as React.CSSProperties}
              >
                <button
                  onClick={() => pick(c.id)}
                  aria-pressed={isActive}
                  className={`spine ${isActive ? "spine-on" : ""}`}
                  style={
                    {
                      "--edge": bank.color,
                      "--edge2": bank.c2,
                      "--pct": Math.max(0.02, spend / peak),
                    } as React.CSSProperties
                  }
                  title={title}
                >
                  <span className="spine-edge" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-ink">{c.card_label}</span>
                      <span className="tabular shrink-0 text-[12px] text-ink2">{spend > 0 ? inr(spend) : "—"}</span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] uppercase tracking-wider text-muted">
                        {bank.short} · •••• {c.last4 ?? "????"}
                      </span>
                      {due ? (
                        <span className={`shrink-0 text-[10px] ${dueTone}`}>
                          {left !== null && left <= 7 && <span className="spine-due-dot" aria-hidden />}
                          {dueLabel(due)}
                          {stat?.nextDueAmount != null && (
                            <span className="tabular text-muted"> · {inr(stat.nextDueAmount)}</span>
                          )}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] text-muted">{txnText}</span>
                      )}
                    </span>
                    <span className="spine-track" aria-hidden>
                      <span className="spine-fill" />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {cards.length > 0 && (
        <p className="mt-3 text-center text-[11px] text-muted">
          {active ? "Click the selected card again to show all" : "Select a card to filter the dashboard to it"}
        </p>
      )}
    </div>
  );
}
