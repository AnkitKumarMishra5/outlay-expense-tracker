import { Analytics } from "./types";

export type Bill = Analytics["dues"][number];

/** Banks usually set the due date 18 to 22 days after the statement is made. */
export const DUE_AFTER_CLOSE_DAYS = 20;

/**
 * The month a statement belongs to, saved with it so every screen agrees: the
 * printed statement date, then the end of the billing period. With neither
 * printed, the statement is taken to have closed twenty days before its due
 * date, and never before the last charge on it.
 */
export function statementMonthFor(
  s: { statementDate?: string | null; periodEnd?: string | null; dueDate?: string | null; lastTxnDate?: string | null },
  fallback: string
): string {
  if (s.statementDate) return s.statementDate.slice(0, 7);
  if (s.periodEnd) return s.periodEnd.slice(0, 7);
  if (s.dueDate) {
    const estimate = new Date(Date.parse(`${s.dueDate}T00:00:00Z`) - DUE_AFTER_CLOSE_DAYS * 86_400_000).toISOString().slice(0, 10);
    return (s.lastTxnDate && s.lastTxnDate > estimate ? s.lastTxnDate : estimate).slice(0, 7);
  }
  return (s.lastTxnDate ?? fallback).slice(0, 7);
}

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthIndex(day: string) {
  const [y, m] = day.split("-").map(Number);
  return y * 12 + (m - 1);
}

// A cycle closes on the statement date and falls due 15 to 25 days later, so it
// straddles two calendar months. Older than last month means a statement is
// missing, not settled.
function statementMonth(b: Bill) {
  if (b.statement_month) return monthIndex(`${b.statement_month}-01`);
  if (b.statement_date) return monthIndex(b.statement_date);
  const due = Date.parse(`${b.day}T00:00:00`) - DUE_AFTER_CLOSE_DAYS * 86_400_000;
  return monthIndex(new Date(due).toISOString().slice(0, 10));
}

/** Each card's bill for a statement month, or its latest bill when no month is picked. */
export function billsByCard(dues: Bill[], month: string | null) {
  const out: Record<string, { amount: number | null; settled: boolean; txns: number | null }> = {};
  for (const d of [...dues].sort((a, b) => a.day.localeCompare(b.day))) {
    if (month && billMonth(d) !== month) continue;
    const prior = month ? out[d.card_id] : undefined;
    out[d.card_id] = {
      amount: d.amount != null ? Number(d.amount) : (prior?.amount ?? null),
      settled: Boolean(d.settled) && (prior?.settled ?? true),
      txns: d.txn_count != null ? (prior?.txns ?? 0) + Number(d.txn_count) : (prior?.txns ?? null),
    };
  }
  return out;
}

/** The month a statement belongs to: the month it was generated in. */
export function billMonth(b: Bill): string {
  if (b.statement_month) return b.statement_month;
  if (b.statement_date) return b.statement_date.slice(0, 7);
  const due = Date.parse(`${b.day}T00:00:00`) - DUE_AFTER_CLOSE_DAYS * 86_400_000;
  return new Date(due).toISOString().slice(0, 7);
}

export interface BillCycle {
  /** This cycle's bills plus anything still unpaid from before it. */
  current: Bill[];
  open: Bill[];
  settled: Bill[];
  overdue: Bill[];
  /** Still to pay, what was already paid this cycle, and the two together. */
  owed: number;
  cleared: number;
  billed: number;
  overdueOwed: number;
  /** Share of the cycle's money already paid, 0 to 1. */
  progress: number;
}

/** One reading of the cycle, shared by the panel and the figures above it. */
export function billCycle(bills: Bill[], now = today(), month?: string): BillCycle {
  const sorted = [...bills].sort((a, b) => a.day.localeCompare(b.day));

  let current: Bill[];
  if (month) {
    // A chosen month is exactly its own statements, with nothing carried in.
    const want = monthIndex(`${month}-01`);
    current = sorted.filter((b) => statementMonth(b) === want);
  } else {
    const thisMonth = monthIndex(now);
    const live = new Map<string, Bill>();
    for (const b of sorted) {
      if (thisMonth - statementMonth(b) <= 1) live.set(b.card_id, b);
    }
    const cycle = [...live.values()];
    const cycleIds = new Set(cycle.map((b) => b.id));
    current = [...cycle, ...sorted.filter((b) => !b.settled && !cycleIds.has(b.id))];
  }

  const open = current.filter((b) => !b.settled);
  const settled = current.filter((b) => b.settled);
  const overdue = open.filter((b) => b.day < now);
  const amount = (list: Bill[]) => list.reduce((a, b) => a + Math.max(0, Number(b.amount ?? 0)), 0);

  // A card in credit owes nothing; it does not pay down another card's bill.
  const owed = open.reduce((a, b) => a + Math.max(0, Number(b.amount ?? 0)), 0);
  const cleared = amount(settled);
  // Every bill in the cycle at face value, which is what the statements add up
  // to. Deriving it from cleared plus what is left clips differently and left
  // the figures strip a rupee or two apart from itself.
  const billed = amount(current);

  return {
    current,
    open,
    settled,
    overdue,
    owed,
    cleared,
    billed,
    overdueOwed: overdue.reduce((a, b) => a + Number(b.amount ?? 0), 0),
    progress: billed > 0 ? cleared / billed : 0,
  };
}
