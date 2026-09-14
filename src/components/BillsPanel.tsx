"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import BankBadge from "./BankBadge";
import PayoffMeter from "./PayoffMeter";
import CreditCard from "./CreditCard";
import { useToast } from "./Toasts";
import { inr, localDay } from "@/lib/format";
import { Analytics, CardRow } from "@/lib/types";
import { billCycle, today, type Bill as CycleBill } from "@/lib/bills";
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

function daysFrom(now: string, day: string) {
  return Math.round((Date.parse(`${day}T00:00:00`) - Date.parse(`${now}T00:00:00`)) / 86_400_000);
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
  month,
}: {
  bills: Bill[];
  onSettle?: (id: string, settled: boolean) => Promise<void> | void;
  /** Only used to pad the all-clear fan when a cycle had one or two bills. */
  cards?: CardRow[];
  /** Set when the dashboard is filtered to a single card. */
  activeId?: string | null;
  /** The month the dashboard is showing, or null for all time. */
  month?: string | null;
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

  const { current, open, settled: currentSettled, overdue, cleared, billed } =
    billCycle(bills as CycleBill[], now, month ?? undefined);
  // All time is every statement, not a cycle, and says so.
  const period = month ? "this cycle" : "across all statements";

  // Nothing left to pay, and there was something to pay in the first place.
  const allClear = open.length === 0 && current.length > 0 && !held;
  // Bills outside the cycle on screen that are still unpaid.
  const elsewhereIds = new Set(current.map((b) => b.id));
  const elsewhere = bills.filter((b) => !b.settled && !elsewhereIds.has(b.id));
  const elsewhereOwed = elsewhere.reduce((a, b) => a + Math.max(0, Number(b.amount ?? 0)), 0);
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
  const clearedTotal = cleared;

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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-sm font-medium text-ink2">Bills</h2>
        <p className="text-xs text-ink2">
          {open.length > 0 && (
            <>
              <span className="text-warn">
                <span className="tabular">{open.length}</span> due
              </span>
              {" · "}
            </>
          )}
          <span className={currentSettled.length ? "text-good" : ""}>
            <span className="tabular">{currentSettled.length}</span> of <span className="tabular">{current.length}</span>{" "}
            settled
          </span>{" "}
          {period}
        </p>
        {currentSettled.length > 0 && (
          <button
            onClick={() => setShowSettled((v) => !v)}
            className="ml-auto shrink-0 rounded-md border border-line px-2 py-1 text-[11px] text-ink2 transition-colors hover:border-muted hover:text-ink"
          >
            {showSettled ? `Show ${open.length} outstanding` : `Show ${currentSettled.length} settled`}
          </button>
        )}
      </div>

      {/* The month drawn as the bills it is made of, so what is left to clear
          is a visible gap rather than a number to work out. */}
      {billed > 0 && !allClear && (
        <div className="mt-3">
          <PayoffMeter
            bills={current.map((b) => ({ id: b.id, overdue: !b.settled && b.day < now }))}
            settled={clearedTotal}
            billed={billed}
            period={period}
            remaining={open.length}
          />
        </div>
      )}

      {overdue.length > 0 && !showSettled && (
        <p className="mt-2 rounded-md border border-bad/40 bg-bad/10 px-2.5 py-1.5 text-xs text-bad">
          {overdue.length === 1
            ? "One bill is past its due date."
            : `${overdue.length} bills are past their due date.`}
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
              <BankBadge bankId={b.bank_id} size={22} />
              <span className="min-w-0 flex-1 truncate">
                <span className="text-ink">{b.card_label}</span>{" "}
                <span className="text-muted">•••• {b.last4 ?? "????"}</span>
              </span>
              <span className={`hidden whitespace-nowrap sm:inline ${late ? "text-bad" : "text-muted"}`}>
                {b.settled ? (
                  <>
                    <span className="text-good">settled{b.paid_at ? ` ${localDay(b.paid_at)}` : ""}</span> · due {b.day}
                  </>
                ) : (
                  relative(b.day, now)
                )}
              </span>
              <span className={`whitespace-nowrap tabular ${b.settled ? "text-muted" : "text-ink"}`}>{inr(Number(b.amount ?? 0))}</span>
              {onSettle && !credit && (
                <button
                  onClick={() => settle(b, !b.settled)}
                  disabled={busy === b.id}
                  className={`shrink-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10.5px] transition-colors disabled:opacity-40 ${
                    b.settled
                      ? "border-line text-muted hover:border-muted hover:text-ink"
                      : "border-good/50 text-good hover:bg-good/10"
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
            {current.length === 1 ? "" : ` across ${current.length} bills`}{month ? " this cycle" : ""}.
            {elsewhere.length === 0 ? (
              activeId ? " Nothing outstanding on this card." : " No card has anything outstanding."
            ) : (
              <>
                {" "}
                <span className="text-warn">
                  <span className="tabular">{inr(elsewhereOwed)}</span>
                  {activeId
                    ? " from an earlier cycle is still outstanding on this card."
                    : ` is still outstanding on ${
                        elsewhere.length === 1 ? "one bill" : `${elsewhere.length} bills`
                      } from ${elsewhere.length === 1 ? "another cycle" : "other cycles"}.`}
                </span>
              </>
            )}
          </p>
        </div>
      )}

      {queue.length === 0 && !allClear && (
        <p className="mt-2 text-xs text-muted">{showSettled ? `Nothing settled ${period} yet.` : "Nothing outstanding."}</p>
      )}
    </div>
  );
}
