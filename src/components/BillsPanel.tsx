"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import CreditCard from "./CreditCard";
import { useToast } from "./Toasts";
import { inr, localDay } from "@/lib/format";
import { bankById } from "@/lib/banks";
import { Analytics, CardRow } from "@/lib/types";
import { celebrate } from "@/lib/celebrate";
import { play } from "@/lib/sound";

export type Bill = Analytics["dues"][number];

/**
 * Which slot each card takes, by rank. The biggest payment gets the middle of
 * the fan and sits on top; the rest work outwards alternately, so the fan stays
 * balanced however many cards it holds.
 */
const SLOT_ORDER: Record<number, number[]> = {
  1: [0],
  2: [0, 1],
  3: [1, 0, 2],
  4: [1, 2, 0, 3],
  5: [2, 1, 3, 0, 4],
};

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysFrom(now: string, day: string) {
  return Math.round((Date.parse(`${day}T00:00:00`) - Date.parse(`${now}T00:00:00`)) / 86_400_000);
}

function monthIndex(day: string) {
  const [y, m] = day.split("-").map(Number);
  return y * 12 + (m - 1);
}

// A cycle closes on the statement date and falls due 15 to 25 days later, so it straddles
// two calendar months. Older than last month means a statement is missing, not settled.
function statementMonth(b: Bill) {
  if (b.statement_date) return monthIndex(b.statement_date);
  const due = Date.parse(`${b.day}T00:00:00`) - 18 * 86_400_000;
  return monthIndex(new Date(due).toISOString().slice(0, 10));
}

function relative(day: string, now: string) {
  const diff = daysFrom(now, day);
  if (diff === 0) return "due today";
  if (diff > 0) return `in ${diff} day${diff === 1 ? "" : "s"}`;
  return `${-diff} day${diff === -1 ? "" : "s"} overdue`;
}

export default function BillsPanel({
  bills,
  onSettle,
  cards,
  activeId,
}: {
  bills: Bill[];
  onSettle?: (id: string, settled: boolean) => Promise<void> | void;
  /** Only used to pad the all-clear fan when a cycle had one or two bills. */
  cards?: CardRow[];
  /** Set when the dashboard is filtered to a single card. */
  activeId?: string | null;
}) {
  const now = today();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [clearing, setClearing] = useState<string | null>(null);
  /** Holds the all-clear panel back while the settle flourish is still on screen. */
  const [held, setHeld] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(holdTimer.current), []);
  const [showSettled, setShowSettled] = useState(false);

  if (bills.length === 0) return null;

  const thisMonth = monthIndex(now);
  const live = new Map<string, Bill>();
  for (const b of [...bills].sort((a, b) => a.day.localeCompare(b.day))) {
    if (thisMonth - statementMonth(b) <= 1) live.set(b.card_id, b);
  }
  const cycle = [...live.values()];
  const cycleIds = new Set(cycle.map((b) => b.id));

  const carried = bills.filter((b) => !b.settled && !cycleIds.has(b.id));
  const current = [...cycle, ...carried];
  const open = current.filter((b) => !b.settled);
  const currentSettled = current.filter((b) => b.settled);
  const overdue = open.filter((b) => b.day < now);
  const owed = open.reduce((a, b) => a + Number(b.amount ?? 0), 0);
  const overdueOwed = overdue.reduce((a, b) => a + Number(b.amount ?? 0), 0);

  // Nothing left to pay, and there was something to pay in the first place.
  const allClear = open.length === 0 && current.length > 0 && !held;
  /**
   * The fan, biggest payment at the front. One face per card, so a card with
   * two bills on it appears once, ranked by its largest. A cycle with a single
   * bill would otherwise show a lone card, so the rest of the wallet fills in
   * behind it; only the front card is one you actually cleared.
   */
  const clearedCards = (() => {
    const best = new Map<string, { bill: Bill; amount: number }>();
    for (const b of currentSettled) {
      const amount = Math.max(0, Number(b.amount ?? 0));
      const prev = best.get(b.card_id);
      if (!prev || amount > prev.amount) best.set(b.card_id, { bill: b, amount });
    }
    const faces = [...best.values()]
      .sort((a, b) => b.amount - a.amount)
      .map((v) => ({ id: v.bill.card_id, bankId: v.bill.bank_id, label: v.bill.card_label, last4: v.bill.last4 }));
    // Padding only makes sense for the whole wallet. Filtered to one card, the
    // other cards are not what was settled and have no business being shown.
    if (!activeId) {
      for (const c of cards ?? []) {
        if (faces.length >= 3) break;
        if (faces.some((f) => f.id === c.id)) continue;
        faces.push({ id: c.id, bankId: c.bank_id, label: c.card_label, last4: c.last4 });
      }
    }
    return faces.slice(0, 4);
  })();
  const clearedTotal = currentSettled.reduce((a, b) => a + Math.max(0, Number(b.amount ?? 0)), 0);

  const queue = [...(showSettled ? currentSettled : open)].sort((a, b) =>
    showSettled ? b.day.localeCompare(a.day) : a.day.localeCompare(b.day)
  );

  async function settle(b: Bill, next: boolean) {
    if (!onSettle) return;
    // Was this the one holding the cycle open?
    const finishesTheCycle = next && open.length === 1 && open[0].id === b.id;
    setBusy(b.id);
    if (next) {
      setClearing(b.id);
      celebrate({
        kind: "settled",
        card: { bankId: b.bank_id, label: b.card_label, last4: b.last4 },
        amount: Number(b.amount ?? 0),
        detail: `Was due ${b.day}`,
      });
    } else {
      play("unsettle");
    }
    await onSettle(b.id, next);
    setBusy(null);
    setClearing(null);
    // The settle flourish owns the screen for 2.6s. Wait for it to finish, then
    // bring in the all-clear panel and its cadence together.
    if (finishesTheCycle) {
      setHeld(true);
      holdTimer.current = setTimeout(() => {
        play("allclear");
        setHeld(false);
      }, 2750);
    }
    if (!next) {
      toast.push(`${b.card_label} back in what is owed`, { detail: `Due ${b.day}`, tone: "info" });
    }
  }

  return (
    <div className="card rise min-w-0 p-5" style={{ "--d": "120ms" } as React.CSSProperties}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-sm font-medium text-ink2">Bills</h2>
        <p className="text-sm">
          <span className={open.length === 0 ? "text-good" : "text-ink"}>
            <span className="font-semibold tabular">
              {currentSettled.length}/{current.length}
            </span>{" "}
            settled this cycle
          </span>
          {open.length > 0 && (
            <>
              <span className="text-muted"> · </span>
              <span className="tabular text-warn">{inr(owed)}</span>
              <span className="text-ink2"> still owed</span>
            </>
          )}
        </p>
        <button
          onClick={() => setShowSettled((v) => !v)}
          className="ml-auto rounded-md border border-line px-2 py-1 text-[11px] text-ink2 transition-colors hover:border-muted hover:text-ink"
        >
          {showSettled ? `Show ${open.length} outstanding` : `Show ${currentSettled.length} settled`}
        </button>
      </div>

      {overdue.length > 0 && !showSettled && (
        <p className="mt-2 rounded-md border border-bad/40 bg-bad/10 px-2.5 py-1.5 text-xs text-bad">
          {overdue.length} bill{overdue.length === 1 ? "" : "s"} past the due date, {inr(overdueOwed)} outstanding.
        </p>
      )}

      <ul className="mt-3 space-y-1.5">
        {queue.slice(0, 8).map((b, i) => {
          const late = !b.settled && b.day < now;
          const credit = Number(b.amount ?? 0) <= 0;
          return (
            <li
              key={b.id}
              className={`rise flex items-center gap-2.5 rounded-lg border border-line bg-surface2 px-2.5 py-2 text-xs ${clearing === b.id ? "bill-clearing" : ""}`}
              style={{ "--d": `${Math.min(i, 8) * 40}ms` } as React.CSSProperties}
            >
              <span className="h-6 w-1 shrink-0 rounded-full" style={{ background: bankById(b.bank_id).color }} />
              <span className="min-w-0 flex-1 truncate">
                <span className="text-ink">{b.card_label}</span>{" "}
                <span className="text-muted">•••• {b.last4 ?? "????"}</span>
              </span>
              <span className={`hidden whitespace-nowrap sm:inline ${late ? "text-bad" : "text-muted"}`}>
                {b.settled ? (b.paid_at ? `settled ${localDay(b.paid_at)} · due ${b.day}` : `settled · due ${b.day}`) : relative(b.day, now)}
              </span>
              <span className="whitespace-nowrap tabular text-ink">{inr(Number(b.amount ?? 0))}</span>
              {onSettle && !credit && (
                <button
                  onClick={() => settle(b, !b.settled)}
                  disabled={busy === b.id}
                  className={`shrink-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10.5px] transition-colors disabled:opacity-40 ${
                    b.settled
                      ? "border-line text-muted hover:border-muted hover:text-ink"
                      : "border-accent/50 text-accent hover:bg-accent/10"
                  }`}
                >
                  {busy === b.id ? "..." : b.settled ? "Mark as unsettled" : "Mark as settled"}
                </button>
              )}
              {credit && <span className="shrink-0 text-[11px] text-good">in credit</span>}
            </li>
          );
        })}
      </ul>

      {queue.length > 8 && (
        <p className="mt-2 text-[11px] text-muted">{queue.length - 8} more on the statements page.</p>
      )}
      {allClear && !showSettled && (
        <div className="allclear">
          <div className="allclear-fan" aria-hidden>
            <span className="allclear-floor" />
            <div className="allclear-tilt">
              {clearedCards.map((f, rank) => {
                const n = clearedCards.length;
                // Slots are symmetric about the centre and the whole fan keeps
                // roughly the same width whatever the count, so two cards and
                // five cards both look deliberate rather than cramped or sparse.
                const step = n > 1 ? Math.min(17, 44 / (n - 1)) : 0;
                const slot = SLOT_ORDER[n]?.[rank] ?? rank;
                const angle = (slot - (n - 1) / 2) * step;
                return (
                  <motion.span
                    key={f.id}
                    className="allclear-card"
                    style={{ zIndex: n - rank }}
                    initial={{ opacity: 0, y: 22, rotate: 0 }}
                    animate={{ opacity: 1, y: Math.abs(angle) * 0.34, rotate: angle }}
                    transition={{ type: "spring", stiffness: 250, damping: 21, delay: 0.07 * rank }}
                  >
                    <span className="allclear-face">
                      <CreditCard bankId={f.bankId} label={f.label} last4={f.last4} />
                    </span>
                  </motion.span>
                );
              })}
            </div>
            <span className="allclear-sweep" />
          </div>
          <p className="allclear-title">
            {current.length === 1 ? "This bill is settled" : "Every bill is settled"}
          </p>
          <p className="allclear-sub">
            <span className="tabular">{inr(clearedTotal)}</span> cleared
            {current.length === 1 ? "" : ` across ${current.length} bills`} this cycle. Nothing is owed.
          </p>
        </div>
      )}

      {queue.length === 0 && !allClear && (
        <p className="mt-2 text-xs text-muted">{showSettled ? "Nothing settled this cycle yet." : "Nothing outstanding."}</p>
      )}
    </div>
  );
}
