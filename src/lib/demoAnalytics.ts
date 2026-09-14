import { DEMO_CARDS, DEMO_DUES, DEMO_TXNS } from "./demo";
import { Analytics, Timeline } from "./types";
import { detectSubscriptions } from "./subscriptions";
import { Range, rangeStart } from "./format";
import { PAYMENT_PATTERN } from "./categories";

const round = (n: number) => Math.round(n * 100) / 100;

/** Demo bills are paid a couple of days early, and never in the future. */
function settledOn(dueDay: string): string {
  const due = Date.parse(`${dueDay}T00:00:00`) - 2 * 86_400_000;
  const when = Math.min(due, Date.now());
  return new Date(when).toISOString().slice(0, 10);
}

/** The demo's statement months, newest first. */
export const DEMO_MONTHS = [...new Set(DEMO_DUES.map((d) => d.statementDate.slice(0, 7)))].sort().reverse();

/**
 * Which statement month a demo charge belongs to. The demo has no statement
 * ids, so a charge joins the first statement on its own card dated on or after
 * it, the way a real cycle closes.
 */
function demoStatementMonth(txn: { card: number; date: string }): string | null {
  const label = DEMO_CARDS[txn.card]?.card_label;
  const closing = DEMO_DUES.filter((d) => d.cardLabel === label && d.statementDate >= txn.date).sort((a, b) =>
    a.statementDate.localeCompare(b.statementDate)
  )[0];
  return closing ? closing.statementDate.slice(0, 7) : null;
}

export function demoAnalytics(range: Range, cardIndex: number | null, month?: string | null): Analytics & Timeline {
  const start = month ? null : rangeStart(range);
  const rows = DEMO_TXNS.filter(
    (t) =>
      (month ? demoStatementMonth(t) === month : !start || t.date >= start) &&
      (cardIndex === null || t.card === cardIndex)
  );

  const debits = rows.filter((t) => t.type === "debit");
  const credits = rows.filter((t) => t.type === "credit");

  const byCategory = new Map<string, number>();
  const byMerchant = new Map<string, { total: number; n: number; category: string }>();
  const byDay = new Map<string, { debits: number; txns: number }>();
  const dayCard = new Map<string, { debits: number; txns: number }>();

  for (const t of debits) {
    if (t.category !== "Credits") {
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
      const name = t.desc.replace(/[^A-Za-z ]+/g, " ").trim().split(/\s+/).slice(0, 2).join(" ").toUpperCase();
      if (name.length > 2) {
        const m = byMerchant.get(name) ?? { total: 0, n: 0, category: t.category };
        byMerchant.set(name, { total: m.total + t.amount, n: m.n + 1, category: m.category });
      }
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

  // Everything under "Over time" reads across months, so it ignores the month
  // filter the rest of the dashboard is under and only follows the card.
  const spanRows = DEMO_TXNS.filter(
    (t) => t.type === "debit" && (cardIndex === null || t.card === cardIndex)
  );
  const runByMonth = new Map<string, number>();
  const runByStatementMonth = new Map<string, number>();
  const catByMonth = new Map<string, number>();
  const catByStatementMonth = new Map<string, number>();
  for (const t of spanRows) {
    const charged = t.date.slice(0, 7);
    const billed = demoStatementMonth(t);
    runByMonth.set(charged, (runByMonth.get(charged) ?? 0) + t.amount);
    if (billed) runByStatementMonth.set(billed, (runByStatementMonth.get(billed) ?? 0) + t.amount);
    if (t.category === "Credits") continue;
    const a = `${charged}|${t.category}`;
    catByMonth.set(a, (catByMonth.get(a) ?? 0) + t.amount);
    if (billed) {
      const b = `${billed}|${t.category}`;
      catByStatementMonth.set(b, (catByStatementMonth.get(b) ?? 0) + t.amount);
    }
  }
  const spread = (m: Map<string, number>) =>
    [...m.entries()].sort().map(([key, total]) => {
      const [month, category] = key.split("|");
      return { month, category, debits: round(total) };
    });
  const run = (m: Map<string, number>) =>
    [...m.entries()].sort().map(([month, d]) => ({ month, debits: round(d) }));

  const subscriptions = detectSubscriptions(
    DEMO_TXNS.filter((t) => t.type === "debit" && t.category !== "Credits").map((t) => {
      const card = DEMO_CARDS[t.card];
      return {
        cardId: card.id,
        cardLabel: card.card_label,
        bankId: card.bank_id,
        last4: card.last4,
        date: t.date,
        description: t.desc,
        amount: t.amount,
      };
    })
  ).filter((sub) => cardIndex === null || sub.cardId === DEMO_CARDS[cardIndex].id);

  return {
    subscriptions,
    totals: {
      debits: round(debits.reduce((a, t) => a + t.amount, 0)),
      credits: round(credits.reduce((a, t) => a + t.amount, 0)),
      payments: round(credits.filter((t) => new RegExp(PAYMENT_PATTERN, "i").test(t.desc)).reduce((a, t) => a + t.amount, 0)),
      fees: round(debits.filter((t) => t.category === "Fees & Charges").reduce((a, t) => a + t.amount, 0)),
      txns: rows.length,
      spend_txns: debits.length,
      credit_txns: credits.length,
    },
    byMonth: run(runByMonth),
    byStatementMonth: run(runByStatementMonth),
    byCategoryMonth: spread(catByMonth),
    byCategoryStatementMonth: spread(catByStatementMonth),
    months: DEMO_MONTHS,
    byCategory: [...byCategory.entries()]
      .map(([category, total]) => ({ category, total: round(total) }))
      .sort((a, b) => b.total - a.total),
    byCard: perCard,
    biggest: [...debits]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map((t, i) => {
        const card = DEMO_CARDS[t.card] ?? DEMO_CARDS[0];
        return {
          id: `demo-txn-${i}`,
          txn_date: t.date,
          description: t.desc,
          amount: t.amount,
          category: t.category,
          is_fee: t.category === "Fees & Charges" ? 1 : 0,
          is_international: 0,
          card_label: card.card_label,
          bank_id: card.bank_id,
          last4: card.last4,
        };
      }),
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
      statement_month: d.statementDate.slice(0, 7),
      amount: d.amount,
      min_due: d.minDue,
      // The demo's statements carry no previous balance, so the bill is
      // exactly what was charged.
      // Charges before credits, so the strip reads the same way it does on a
      // real statement: total due = spends less refunds and cashbacks.
      total_debits: d.debits,
      txn_count: null,
      settled: d.settled,
      paid_at: d.settled ? settledOn(d.day) : null,
      card_label: d.cardLabel,
      bank_id: d.bankId,
      last4: d.last4,
    })),
  };
}
