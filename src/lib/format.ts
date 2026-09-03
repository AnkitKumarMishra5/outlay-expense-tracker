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
