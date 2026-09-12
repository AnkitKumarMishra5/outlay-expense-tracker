export const inr = (n: number, decimals = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n);

export type Range = "month" | "3m" | "6m" | "fy" | "all";

export const RANGE_LABELS: Record<Range, string> = {
  month: "This month",
  "3m": "Last 3 months",
  "6m": "Last 6 months",
  fy: "This FY",
  all: "All time",
};

export function rangeStart(range: Range, today = new Date()): string | null {
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (range) {
    case "month":
      return iso(new Date(y, m, 1));
    case "3m":
      return iso(new Date(y, m - 2, 1));
    case "6m":
      return iso(new Date(y, m - 5, 1));
    case "fy":
      return iso(new Date(m >= 3 ? y : y - 1, 3, 1));
    case "all":
      return null;
  }
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
};

export function isSettled(paidAt: string | null | undefined, totalDue: number | null | undefined): boolean {
  return Boolean(paidAt) || totalDue == null || totalDue <= 0;
}

/**
 * An ISO timestamp as the calendar day it was where the reader is. Slicing the
 * string instead gives the UTC day, which in IST is yesterday until 05:30.
 */
export function localDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return new Intl.DateTimeFormat("en-CA").format(d);
}

/** "2026-08" for a date, defaulting to today. */
export function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** The half-open window a month covers: start included, end excluded. */
export function monthWindow(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  return { start: iso(new Date(y, m - 1, 1)), end: iso(new Date(y, m, 1)) };
}

/** "August 2026", for the month the dashboard is showing. */
export function monthTitle(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

/** Step a month key forwards or backwards. */
export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + by, 1));
}

/** Chart axis ticks the way they are said here: 1.5k, 80k, 2L, 1.2Cr. */
export function axisTick(v: number): string {
  const n = Math.abs(v);
  if (n >= 1e7) return `${trim(v / 1e7)}Cr`;
  if (n >= 1e5) return `${trim(v / 1e5)}L`;
  if (n >= 1000) return `${trim(v / 1000)}k`;
  return String(Math.round(v));
}

function trim(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
