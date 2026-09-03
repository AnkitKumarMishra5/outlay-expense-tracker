import { DEMO_CARDS, DEMO_DUES, DEMO_TXNS } from "./demo";
import { Analytics } from "./types";
import { Range, rangeStart } from "./format";

const round = (n: number) => Math.round(n * 100) / 100;

export function demoAnalytics(range: Range, cardIndex: number | null): Analytics {
  const start = rangeStart(range);
  const rows = DEMO_TXNS.filter(
    (t) => (!start || t.date >= start) && (cardIndex === null || t.card === cardIndex)
  );

  const debits = rows.filter((t) => t.type === "debit");
  const credits = rows.filter((t) => t.type === "credit");

  const byMonth = new Map<string, number>();
  const byCategory = new Map<string, number>();
  const byDay = new Map<string, { debits: number; txns: number }>();
  const dayCard = new Map<string, { debits: number; txns: number }>();

  for (const t of debits) {
    const month = t.date.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + t.amount);
    if (t.category !== "Payments & Refunds") {
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
    }
    const day = byDay.get(t.date) ?? { debits: 0, txns: 0 };
    byDay.set(t.date, { debits: day.debits + t.amount, txns: day.txns + 1 });
    const key = `${t.date}|${t.card}`;
    const dc = dayCard.get(key) ?? { debits: 0, txns: 0 };
    dayCard.set(key, { debits: dc.debits + t.amount, txns: dc.txns + 1 });
  }

  const perCard = DEMO_CARDS.map((c, i) => {
    const own = debits.filter((t) => t.card === i);
    const nextBill = DEMO_DUES.filter((d) => d.cardLabel === c.card_label && !d.settled).sort((a, b) =>
      a.day.localeCompare(b.day)
    )[0];
    return {
      card_id: c.id,
      card_label: c.card_label,
      bank_id: c.bank_id,
      last4: c.last4,
      debits: round(own.reduce((a, t) => a + t.amount, 0)),
      txns: own.length,
      next_due: nextBill?.day ?? null,
      next_due_amount: nextBill?.amount ?? null,
    };
  }).sort((a, b) => b.debits - a.debits);

  return {
    totals: {
      debits: round(debits.reduce((a, t) => a + t.amount, 0)),
      credits: round(credits.reduce((a, t) => a + t.amount, 0)),
      fees: round(debits.filter((t) => t.category === "Fees & Charges").reduce((a, t) => a + t.amount, 0)),
      txns: rows.length,
    },
    byMonth: [...byMonth.entries()].sort().map(([month, d]) => ({ month, debits: round(d) })),
    byCategory: [...byCategory.entries()]
      .map(([category, total]) => ({ category, total: round(total) }))
      .sort((a, b) => b.total - a.total),
    byCard: perCard,
    recent: [...debits, ...credits]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8)
      .map((t, i) => ({
        id: `demo-txn-${i}`,
        txn_date: t.date,
        description: t.desc,
        amount: t.amount,
        type: t.type,
        category: t.category,
        is_fee: t.category === "Fees & Charges" ? 1 : 0,
      })),
    byDay: [...byDay.entries()].sort().map(([day, v]) => ({ day, debits: round(v.debits), txns: v.txns })),
    dayCards: [...dayCard.entries()].sort().map(([key, v]) => {
      const [day, idx] = key.split("|");
      const c = DEMO_CARDS[Number(idx)];
      return {
        day,
        card_id: c.id,
        card_label: c.card_label,
        bank_id: c.bank_id,
        last4: c.last4,
        debits: round(v.debits),
        txns: v.txns,
      };
    }),
    dues: DEMO_DUES.filter((d) => cardIndex === null || DEMO_CARDS[cardIndex].card_label === d.cardLabel).map((d) => ({
      id: `${d.cardLabel}-${d.day}`,
      card_id: DEMO_CARDS.find((c) => c.card_label === d.cardLabel)?.id ?? d.cardLabel,
      day: d.day,
      statement_date: d.statementDate,
      amount: d.amount,
      min_due: d.minDue,
      settled: d.settled,
      paid_at: d.settled ? d.day : null,
      card_label: d.cardLabel,
      bank_id: d.bankId,
      last4: d.last4,
    })),
  };
}
