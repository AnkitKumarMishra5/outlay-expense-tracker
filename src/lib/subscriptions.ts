export interface RecurringInput {
  cardId: string;
  cardLabel: string;
  bankId: string;
  last4: string | null;
  date: string;
  description: string;
  amount: number;
}

export interface Subscription {
  key: string;
  merchant: string;
  cardId: string;
  cardLabel: string;
  bankId: string;
  last4: string | null;
  cadence: "monthly" | "yearly";
  amount: number;
  charges: number;
  firstSeen: string;
  lastSeen: string;
  perYear: number;
  /** Every charge behind the pattern, oldest first. */
  history: { date: string; amount: number; description: string }[];
  /** When the next one is due, projected from the cadence. */
  nextDue: string;
}

/** The same day-count arithmetic the cadence was worked out from. */
function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const NOISE =
  /\b(?:ref|txn|trn|id|no|inv|order|auth)\b[\s:#-]*[a-z0-9]{4,}|\b\d{6,}\b|\*+\d+|\b(?:pvt|ltd|limited|india|in|bangalore|bengaluru|mumbai|delhi|gurgaon|noida|hyderabad|chennai|pune|us|usa|sgp|nld|irl)\b/gi;

export function merchantKey(description: string): string {
  return description
    .toLowerCase()
    .replace(NOISE, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(" ");
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export function detectSubscriptions(rows: RecurringInput[]): Subscription[] {
  const groups = new Map<string, RecurringInput[]>();
  for (const r of rows) {
    const key = merchantKey(r.description);
    if (key.length < 3) continue;
    const id = `${r.cardId}|${key}`;
    const list = groups.get(id) ?? [];
    list.push(r);
    groups.set(id, list);
  }

  const out: Subscription[] = [];
  for (const [id, list] of groups) {
    if (list.length < 3) continue;
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) gaps.push(days(sorted[i - 1].date, sorted[i].date));
    const gap = median(gaps);
    const cadence: Subscription["cadence"] | null =
      gap >= 25 && gap <= 35 ? "monthly" : gap >= 350 && gap <= 380 ? "yearly" : null;
    if (!cadence) continue;
    if (gaps.some((g) => Math.abs(g - gap) > (cadence === "monthly" ? 8 : 25))) continue;

    const amounts = sorted.map((r) => r.amount);
    const typical = median(amounts);
    if (typical <= 0) continue;
    if (amounts.some((a) => Math.abs(a - typical) / typical > 0.15)) continue;

    const last = sorted[sorted.length - 1];
    out.push({
      key: id,
      merchant: last.description,
      cardId: last.cardId,
      cardLabel: last.cardLabel,
      bankId: last.bankId,
      last4: last.last4,
      cadence,
      amount: Math.round(typical * 100) / 100,
      charges: sorted.length,
      firstSeen: sorted[0].date,
      lastSeen: last.date,
      perYear: Math.round(typical * (cadence === "monthly" ? 12 : 1) * 100) / 100,
      history: sorted.map((r) => ({ date: r.date, amount: r.amount, description: r.description })),
      nextDue: addDays(last.date, Math.round(gap)),
    });
  }

  return out.sort((a, b) => b.perYear - a.perYear);
}
