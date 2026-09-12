"use client";

import { useMemo, useRef, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import BankBadge from "./BankBadge";
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
  /** Transactions on this card's statement for the cycle being shown. */
  billedTxns?: number | null;
}

type SortMode = "bank" | "due" | "name";

/** The money sort, then the two for finding a card. */
const SORTS: { value: SortMode; label: string; title: string }[] = [
  { value: "due", label: "Due", title: "What each card billed this cycle, largest first" },
  { value: "bank", label: "Bank", title: "Grouped by bank" },
  { value: "name", label: "A–Z", title: "By card name" },
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

/** One spring, so every card in the rail moves with the same weight. */
const SPRING = { type: "spring" as const, stiffness: 420, damping: 38, mass: 0.9 };

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
  const [sort, setSort] = useState<SortMode>("due");
  const [flipped, setFlipped] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CardRow | null>(null);
  /** Card ids most recently fronted, newest first. Drives the order behind the hero. */
  const [recent, setRecent] = useState<string[]>([]);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const active = cards.find((c) => c.id === activeId) ?? null;

  /** Largest bill outstanding, or the biggest spender while nothing is owed. */
  const topCard = useMemo(() => {
    if (!cards.length) return null;
    const owing = cards.some((c) => (cardStats?.[c.id]?.nextDueAmount ?? 0) > 0);
    return [...cards].sort((a, b) =>
      owing
        ? (cardStats?.[b.id]?.nextDueAmount ?? 0) - (cardStats?.[a.id]?.nextDueAmount ?? 0)
        : (cardStats?.[b.id]?.debits ?? 0) - (cardStats?.[a.id]?.debits ?? 0)
    )[0];
  }, [cards, cardStats]);

  const hero = active ?? topCard;

  // The deck remembers. Whatever was on top a moment ago is the card directly
  // behind the one that replaced it, the way a real deck would sit.
  const rest = useMemo(() => {
    if (!hero) return [];
    const behind = new Map(cards.filter((c) => c.id !== hero.id).map((c) => [c.id, c]));
    const ordered: CardRow[] = [];
    for (const id of recent) {
      const card = behind.get(id);
      if (card) {
        ordered.push(card);
        behind.delete(id);
      }
    }
    return [...ordered, ...behind.values()].slice(0, 2);
  }, [cards, hero, recent]);

  /** What the bars are drawn against; falls back to spend when nothing is owed. */
  const peak = useMemo(() => {
    const owedPeak = Math.max(0, ...cards.map((c) => cardStats?.[c.id]?.nextDueAmount ?? 0));
    if (owedPeak > 0) return owedPeak;
    return Math.max(1, ...cards.map((c) => cardStats?.[c.id]?.debits ?? 0));
  }, [cards, cardStats]);
  const peakIsOwed = useMemo(
    () => cards.some((c) => (cardStats?.[c.id]?.nextDueAmount ?? 0) > 0),
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
        case "due":
          return (sb?.debits ?? 0) - (sa?.debits ?? 0) || a.card_label.localeCompare(b.card_label);
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

  function changeSort(nextSort: SortMode) {
    if (nextSort === sort) return;
    setSort(nextSort);
  }

  /** Remember what was on top before it is replaced. */
  function remember(leaving: string | undefined | null) {
    if (!leaving) return;
    setRecent((r) => [leaving, ...r.filter((x) => x !== leaving)]);
  }

  function pick(id: string) {
    setFlipped(false);
    const next = id === activeId ? null : id;
    if (hero && hero.id !== id) {
      remember(hero.id);
      play("slide");
    } else {
      play("select");
    }
    onSelect(next);
  }

  function showAll() {
    remember(active?.id);
    play("slide");
    onSelect(null);
  }

  // Grouping by issuer only makes sense when that is the order, and only when
  // there is enough on screen for the stacking to buy anything.
  const grouped = sort === "bank" && !query.trim() && visible.length > 4 && !reduced();
  const groups = useMemo(() => {
    if (!grouped) return [];
    const byBank = new Map<string, CardRow[]>();
    for (const c of visible) {
      const list = byBank.get(c.bank_id);
      if (list) list.push(c);
      else byBank.set(c.bank_id, [c]);
    }
    return [...byBank.entries()].map(([bankId, rows]) => ({
      bankId,
      rows,
      spend: rows.reduce((a, c) => a + (cardStats?.[c.id]?.debits ?? 0), 0),
    }));
  }, [grouped, visible, cardStats]);

  /** One card spine, shared by the flat list and the grouped one. */
  function renderRow(c: CardRow, i: number) {
    const bank = bankById(c.bank_id);
    const stat = cardStats?.[c.id];
    const spend = stat?.debits ?? 0;
    const isActive = c.id === activeId;
    const due = stat?.nextDue ?? null;
    const owed = stat?.nextDueAmount ?? null;
    const txnCount = stat?.billedTxns ?? (stat?.txns != null ? stat.txns : null);
    const left = due ? daysUntil(due) : null;
    const dueTone =
      left === null ? "" : left < 0 ? "text-bad font-medium" : left <= 2 ? "text-bad" : left <= 7 ? "text-warn" : "text-ink2";
    const txnText = stat?.txns ? `${stat.txns} txn${stat.txns === 1 ? "" : "s"}` : "no spend";
    const title = [
      owed != null ? `${inr(owed)} outstanding${due ? `, ${dueLabel(due)}` : ""}` : "Nothing outstanding",
      spend > 0 ? `${inr(spend)} spent on ${txnText}` : "No spend this period",
    ]
      .filter(Boolean)
      .join(" · ");
    return (
      <motion.li
        key={c.id}
        layout
        ref={(el: HTMLLIElement | null) => {
          if (el) rowRefs.current.set(c.id, el);
          else rowRefs.current.delete(c.id);
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        style={{ "--i": i } as React.CSSProperties}
      >
            <button
              onClick={() => pick(c.id)}
              aria-pressed={isActive}
              className={`spine ${isActive ? "spine-on" : ""}`}
              style={
                {
                  "--edge": bank.color,
                  "--edge2": bank.c2,
                  "--pct": Math.max(0.02, (peakIsOwed ? (owed ?? 0) : spend) / peak),
                } as React.CSSProperties
              }
              title={title}
            >
              <span className="spine-edge" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] font-medium text-ink">{c.card_label}</span>
                  {owed != null ? (
                    <span className={`shrink-0 text-[13px] font-semibold tabular ${dueTone || "text-ink"}`}>
                      {inr(owed)}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[11px] text-muted">settled</span>
                  )}
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="flex shrink-0 items-center gap-1.5">
                    <BankBadge bankId={c.bank_id} size={16} />
                    <span className="text-[10px] uppercase tracking-wider text-muted">
                      •••• {c.last4 ?? "????"}
                      {txnCount !== null && (
                        <>
                          {" · "}
                          {txnCount} txn{txnCount === 1 ? "" : "s"}
                        </>
                      )}
                    </span>
                  </span>
                  <span className="min-w-0 truncate text-right text-[10px] text-muted">
                    {due ? (
                      <span className={dueTone}>
                        {left !== null && left <= 7 && <span className="spine-due-dot" aria-hidden />}
                        {dueLabel(due)}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="spine-track" aria-hidden>
                  <span className="spine-fill" />
                </span>
              </span>
            </button>
      </motion.li>
    );
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
            <button onClick={showAll} className="rounded-md px-2 py-1 text-xs text-accent hover:bg-accent/10">
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
          {active && (
            <p className="mt-1.5 text-center text-[10px] uppercase tracking-widest text-muted">
              {flipped ? "click to flip back" : "click card for period figures"}
            </p>
          )}
        </div>
      )}

      {cards.length > 1 && (
      <div className="mb-3 flex gap-1">
        {SORTS.map((option) => (
          <button
            key={option.value}
            onClick={() => changeSort(option.value)}
            aria-pressed={sort === option.value}
            title={option.title}
            className={`flex-1 whitespace-nowrap rounded-md border px-1.5 py-1 text-[11px] transition-colors ${
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
        <LayoutGroup>
          <ul className="rail-list space-y-1 overflow-y-auto overflow-x-hidden pr-1">
            {grouped
              ? groups.map((g) => {
                  const bank = bankById(g.bankId);
                  return (
                    <motion.li key={`bank-${g.bankId}`} layout transition={SPRING} className="bank-group">
                      <p className="bank-head">
                        <span className="bank-chip" style={{ background: bank.color }} aria-hidden />
                        <span className="bank-name">{bank.name}</span>
                        <span className="bank-count">{g.rows.length}</span>
                        <span className="bank-spend tabular">{g.spend > 0 ? inr(g.spend) : "\u2013"}</span>
                      </p>
                      <ul className="bank-fan">{g.rows.map((c, i) => renderRow(c, i))}</ul>
                    </motion.li>
                  );
                })
            : visible.map((c, i) => renderRow(c, i))}
          </ul>
        </LayoutGroup>
      )}
      {cards.length > 0 && (
        <p className="mt-3 text-center text-[11px] text-muted">
          {active ? "Click the selected card again to show all" : "Select a card to filter the dashboard to it"}
        </p>
      )}
    </div>
  );
}
