"use client";

import Link from "next/link";
import CardRail from "@/components/CardRail";
import SegmentedControl from "@/components/SegmentedControl";
import TrendChart from "@/components/charts/TrendChart";
import CategoryDonut from "@/components/charts/CategoryDonut";
import CardSpendBars from "@/components/charts/CardSpendBars";
import TxnTable from "@/components/TxnTable";
import SpendCalendar from "@/components/SpendCalendar";
import BillsPanel from "@/components/BillsPanel";
import Subscriptions from "@/components/Subscriptions";
import TopMerchants from "@/components/TopMerchants";
import CountUp from "@/components/CountUp";
import { inr, Range, RANGE_LABELS } from "@/lib/format";
import { Analytics, CardRow } from "@/lib/types";

export interface CardStat {
  debits: number;
  txns: number;
  nextDue: string | null;
  nextDueAmount: number | null;
}

export default function DashboardView({
  title,
  cards,
  data,
  range,
  onRange,
  activeId,
  onSelectCard,
  cardStats,
  stats,
  viewKey,
  dimmed = false,
  demo = false,
  onCardsChanged,
  onSettle,
  onTxnChanged,
  empty,
}: {
  title: string;
  cards: CardRow[];
  data: Analytics;
  range: Range;
  onRange: (r: Range) => void;
  activeId: string | null;
  onSelectCard: (id: string | null) => void;
  cardStats: Record<string, CardStat>;
  stats: { rangeLabel: string; debits: number; credits: number; fees: number; txns: number } | null;
  viewKey: string;
  dimmed?: boolean;
  demo?: boolean;
  onCardsChanged?: () => void;
  onSettle?: (id: string, settled: boolean) => Promise<void> | void;
  onTxnChanged?: () => void;
  empty?: React.ReactNode;
}) {
  const tiles = [
    { label: "Total spend", value: Number(data.totals.debits), fmt: (n: number) => inr(n) },
    { label: "Payments & credits", value: Number(data.totals.credits), fmt: (n: number) => inr(n) },
    {
      label: "Fees & charges",
      value: Number(data.totals.fees),
      fmt: (n: number) => inr(n),
      warn: Number(data.totals.fees) > 0,
    },
    { label: "Transactions", value: Number(data.totals.txns), fmt: (n: number) => String(Math.round(n)) },
  ];

  const statementsHref = demo ? "/register" : "/statements";
  const transactionsHref = demo ? "/register" : "/transactions";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <div className="-mx-1 ml-auto max-w-full overflow-x-auto px-1">
          <SegmentedControl
            options={(Object.keys(RANGE_LABELS) as Range[]).map((r) => ({ value: r, label: RANGE_LABELS[r] }))}
            value={range}
            onChange={onRange}
          />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <div className={`rise mx-auto w-full max-w-[360px] lg:mx-0 lg:max-w-none ${demo ? "" : "lg:sticky lg:top-20"}`}>
          <CardRail
            cards={cards}
            activeId={activeId}
            onSelect={onSelectCard}
            cardStats={cardStats}
            onCardsChanged={onCardsChanged}
            stats={stats}
          />
        </div>

        <div className="min-w-0 space-y-4">
          {empty ?? (
            <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map((s, i) => (
              <div key={s.label} className="card stat-tile rise p-4" style={{ "--d": `${i * 60}ms` } as React.CSSProperties}>
                <p className="text-xs text-muted">{s.label}</p>
                <p className={`mt-1 text-xl font-semibold tabular ${s.warn ? "text-warn" : ""}`}>
                  <CountUp value={s.value} format={s.fmt} />
                </p>
              </div>
            ))}
          </div>

          <BillsPanel bills={data.dues ?? []} onSettle={onSettle} cards={cards} activeId={activeId} />

          <div
            className="grid min-w-0 grid-cols-1 gap-4 transition-opacity duration-300 lg:grid-cols-2"
            style={{ opacity: dimmed ? 0.45 : 1 }}
          >
            <div className="grid min-w-0 gap-4">
              <div className="card rise min-w-0 p-5" style={{ "--d": "160ms" } as React.CSSProperties}>
                <h2 className="mb-4 text-sm font-medium text-ink2">Spend trend</h2>
                <TrendChart key={viewKey} data={data.byMonth.map((m) => ({ month: m.month, debits: Number(m.debits) }))} />
              </div>
              <div className="card rise min-w-0 p-5" style={{ "--d": "200ms" } as React.CSSProperties}>
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 className="text-sm font-medium text-ink2">Where it went</h2>
                  <span className="text-[11px] text-muted">by merchant</span>
                </div>
                <TopMerchants key={viewKey} rows={data.byMerchant ?? []} />
              </div>
            </div>
            <div className="card rise min-w-0 p-5" style={{ "--d": "220ms" } as React.CSSProperties}>
              <h2 className="mb-4 text-sm font-medium text-ink2">Category split</h2>
              <CategoryDonut key={viewKey} data={data.byCategory} />
            </div>
          </div>

          <div className="card rise min-w-0 p-5" style={{ "--d": "280ms" } as React.CSSProperties}>
            <h2 className="mb-4 text-sm font-medium text-ink2">Spend by card</h2>
            <CardSpendBars
              key={viewKey}
              data={data.byCard.map((d) => ({ ...d, debits: Number(d.debits), txns: Number(d.txns) })).filter((d) => d.debits > 0)}
              colorIndex={Object.fromEntries(cards.map((c, i) => [c.id, i]))}
            />
          </div>

          <div className="card rise min-w-0 p-5" style={{ "--d": "340ms" } as React.CSSProperties}>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium text-ink2">Recent activity</h2>
              <span className="flex gap-3 text-xs">
                <Link href={transactionsHref} className="text-accent hover:underline">
                  All transactions
                </Link>
                <Link href={statementsHref} className="text-ink2 hover:underline">
                  Statements
                </Link>
              </span>
            </div>
            <TxnTable txns={data.recent} editable={!demo} onChanged={onTxnChanged} />
          </div>

          <Subscriptions subs={data.subscriptions ?? []} />

          <div className="card rise min-w-0 p-5" style={{ "--d": "400ms" } as React.CSSProperties}>
            <h2 className="mb-4 text-sm font-medium text-ink2">Calendar</h2>
            <SpendCalendar
              data={(data.byDay ?? []).map((d) => ({ day: d.day, debits: Number(d.debits), txns: Number(d.txns) }))}
              dayCards={(data.dayCards ?? []).map((d) => ({
                day: d.day,
                cardId: d.card_id,
                cardLabel: d.card_label,
                bankId: d.bank_id,
                last4: d.last4,
                debits: Number(d.debits),
                txns: Number(d.txns),
              }))}
              dues={(data.dues ?? []).map((d) => ({
                id: d.id,
                day: d.day,
                amount: d.amount != null ? Number(d.amount) : null,
                minDue: d.min_due != null ? Number(d.min_due) : null,
                settled: Boolean(d.settled),
                cardLabel: d.card_label,
                bankId: d.bank_id,
                last4: d.last4,
              }))}
              onSettle={onSettle}
            />
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
