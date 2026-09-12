"use client";

import { useState } from "react";
import Link from "next/link";
import MonthPicker from "./MonthPicker";
import { billCycle, today as billToday } from "@/lib/bills";

import CardRail from "@/components/CardRail";
import TrendChart from "@/components/charts/TrendChart";
import CategoryTrend from "@/components/charts/CategoryTrend";
import CategoryDonut from "@/components/charts/CategoryDonut";
import CategoryMovement from "@/components/CategoryMovement";
import LargestCharges from "@/components/LargestCharges";
import SpendCalendar from "@/components/SpendCalendar";
import BillsPanel from "@/components/BillsPanel";
import Subscriptions from "@/components/Subscriptions";
import CycleBuildup from "@/components/charts/CycleBuildup";
import CountUp from "@/components/CountUp";
import { inr, monthTitle, shiftMonth } from "@/lib/format";
import { Analytics, CardRow, Timeline } from "@/lib/types";

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
  timeline,
  month,
  months,
  onMonth,
  activeId,
  onSelectCard,
  cardStats,
  stats,
  viewKey,
  dimmed = false,
  demo = false,
  onCardsChanged,
  onSettle,
  empty,
}: {
  title: string;
  cards: CardRow[];
  data: Analytics;
  /** Arrives after the rest of the page; its panels wait rather than block it. */
  timeline: Timeline | null;
  /** The month the page is counted in, or null for all time. */
  month: string | null;
  months?: string[];
  onMonth: (m: string | null) => void;
  activeId: string | null;
  onSelectCard: (id: string | null) => void;
  cardStats: Record<string, CardStat>;
  stats: { rangeLabel: string; debits: number; credits: number; fees: number; txns: number } | null;
  viewKey: string;
  dimmed?: boolean;
  demo?: boolean;
  onCardsChanged?: () => void;
  onSettle?: (id: string, settled: boolean) => Promise<void> | void;
  empty?: React.ReactNode;
}) {
  // The trend keeps its own span rather than following the month.
  const [trendSpan, setTrendSpan] = useState<3 | 6 | 12>(6);
  // The same money lands in different months depending on which date you group
  // by: the day it was charged, or the statement that billed it.
  const [trendBy, setTrendBy] = useState<"charged" | "billed">("billed");

  const money = (n: number) => inr(n);

  const cycle = billCycle(data.dues ?? [], billToday(), month ?? undefined);

  // Statements, not the calendar: a statement dated 12 August bills a cycle
  // that opened in July, so its charges carry July dates.
  const billedSpend = cycle.current.reduce((a, b) => a + Number(b.total_debits ?? 0), 0);
  const totalDue = cycle.billed;
  // What last cycle left behind. The previous balance and the payments
  // against it cancel for anyone who paid in full, leaving the credits.
  const carriedOver = totalDue - billedSpend;
  // Banks round their own totals, so a balanced cycle can leave paise behind.
  const settledUp = Math.abs(carriedOver) < 1;
  const inCredit = carriedOver < 0;

  const fees = Number(data.totals.fees);
  const feeList =
    fees > 0
      ? (data.fees ?? [])
          .map((f) => `${f.txn_date}  ${f.description}  ${money(Number(f.amount))}  (${f.card_label})`)
          .join("\n") || "The statements did not itemise these charges."
      : "No annual, joining, renewal, late or over-limit fees in this period.";

  const tiles: {
    label: string;
    value: number;
    fmt: (n: number) => string;
    op?: string;
    opLabel?: string;
    lead?: boolean;
    tone?: "accent" | "spend" | "quiet" | "good" | "bad";
    hint?: string;
  }[] = [
    {
      label: "Total due",
      value: totalDue,
      fmt: money,
      lead: true,
      tone: "accent" as const,
      op: "=",
      opLabel: "equals",
      hint: "Every statement in this period added up, as each card billed it.",
    },
    {
      label: "Billed spends",
      value: billedSpend,
      fmt: money,
      tone: "spend" as const,
      op: !settledUp && inCredit ? "\u2212" : "+",
      opLabel: !settledUp && inCredit ? "minus" : "plus",
      hint: "Charges on the statements in this period, as each one reported them. A statement dated the 12th bills a cycle that began in the previous month, so this is not the same as spend by calendar date.",
    },
    {
      label: settledUp ? "Carried over" : inCredit ? "Credits & refunds" : "Unpaid carry-over",
      value: settledUp ? 0 : Math.abs(carriedOver),
      fmt: money,
      tone: settledUp ? ("quiet" as const) : inCredit ? ("good" as const) : ("bad" as const),
      hint: settledUp
        ? "Last cycle was cleared in full and these cards gave nothing back, so the bill is exactly what was charged."
        : inCredit
          ? "What the cards gave back rather than charged: refunds, reversals, cashback, and anything overpaid. It is the whole of what last cycle left behind once the previous balance and the payments against it cancelled out."
          : "Part of last cycle's bill was not cleared, so it has rolled into this one and is being billed again.",
    },
    {
      label: "Fees & charges",
      value: fees,
      fmt: money,
      tone: fees > 0 ? ("bad" as const) : ("good" as const),
      hint: feeList,
    },
    {
      label: "Transactions",
      value: Number(data.totals.txns),
      fmt: (n: number) => String(Math.round(n)),
      tone: "quiet" as const,
    },
  ];

  /** The months the spend trend is showing, so both charts cover the same run. */
  const trendRun = (trendBy === "billed" ? timeline?.byStatementMonth : timeline?.byMonth)?.slice(-trendSpan) ?? [];
  const recentMonths = new Set(trendRun.map((m) => m.month));

  const statementsHref = demo ? "/register" : "/statements";
  const transactionsHref = demo ? "/register" : "/transactions";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <div className="ml-auto min-w-0">
          <MonthPicker value={month} months={months ?? []} onChange={onMonth} />
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
          <div className="card rise stat-strip" style={{ "--d": "60ms" } as React.CSSProperties}>
            {tiles.map((s) => (
              <div key={s.label} className={`stat-cell ${s.lead ? "is-lead" : ""}`} title={s.hint}>
                <p className="stat-cell-label">{s.label}</p>
                <p
                  className={`stat-cell-value tabular ${
                    s.tone === "accent"
                      ? "stat-accent"
                      : s.tone === "spend"
                        ? "stat-spend"
                        : s.tone === "quiet"
                          ? "stat-quiet"
                        : s.tone === "good"
                          ? "text-good"
                          : s.tone === "bad"
                            ? "text-bad"
                            : ""
                  }`}
                >
                  <CountUp value={s.value} format={s.fmt} />
                </p>
                {s.op && (
                  <span className="stat-op" role="img" aria-label={s.opLabel}>
                    {s.op}
                  </span>
                )}
              </div>
            ))}
          </div>

          <BillsPanel
            bills={data.dues ?? []}
            onSettle={onSettle}
            cards={cards}
            activeId={activeId}
            month={month}
          />

          <div
            className="grid min-w-0 grid-cols-1 gap-4 transition-opacity duration-300 lg:grid-cols-2"
            style={{ opacity: dimmed ? 0.45 : 1 }}
          >
            <div className="grid min-w-0 gap-4">
              <div className="card rise min-w-0 p-5" style={{ "--d": "200ms" } as React.CSSProperties}>
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 className="text-sm font-medium text-ink2">How the bill built up</h2>
                  <span className="text-[11px] text-muted">running total</span>
                </div>
                {timeline ? (
                  <CycleBuildup data={timeline.byDay.map((d) => ({ day: d.day, debits: Number(d.debits) }))} />
                ) : (
                  <div className="shimmer h-[232px] w-full" />
                )}
              </div>
            </div>
            <div className="card rise min-w-0 p-5" style={{ "--d": "220ms" } as React.CSSProperties}>
              <h2 className="mb-4 text-sm font-medium text-ink2">Category split</h2>
              <CategoryDonut key={viewKey} data={data.byCategory} />
            </div>
          </div>
          {month && (data.byCategoryPrev?.length || data.byCategory.length) ? (
            <div className="card rise min-w-0 p-5" style={{ "--d": "280ms" } as React.CSSProperties}>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-medium text-ink2">What changed</h2>
                <span className="text-[11px] text-muted">against {monthTitle(shiftMonth(month, -1))}</span>
              </div>
              <CategoryMovement
                key={viewKey}
                now={data.byCategory.map((d) => ({ category: d.category, total: Number(d.total) }))}
                before={(data.byCategoryPrev ?? []).map((d) => ({ category: d.category, total: Number(d.total) }))}
                monthLabel={monthTitle(shiftMonth(month, -1))}
              />
            </div>
          ) : null}

          <div className="card rise min-w-0 p-5" style={{ "--d": "340ms" } as React.CSSProperties}>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium text-ink2">Largest charges</h2>
              <span className="flex gap-3 text-xs">
                <Link href={transactionsHref} className="text-accent hover:underline">
                  All transactions
                </Link>
                <Link href={statementsHref} className="text-accent hover:underline">
                  All statements
                </Link>
              </span>
            </div>
            <LargestCharges rows={data.biggest ?? []} billed={billedSpend} />
          </div>

          <div className="card rise min-w-0 p-5" style={{ "--d": "400ms" } as React.CSSProperties}>
            <h2 className="mb-4 text-sm font-medium text-ink2">Calendar</h2>
            {!timeline ? (
              <div className="shimmer h-[280px] w-full" />
            ) : (
            <SpendCalendar
              data={(timeline?.byDay ?? []).map((d) => ({ day: d.day, debits: Number(d.debits), txns: Number(d.txns) }))}
              dayCards={(timeline?.dayCards ?? []).map((d) => ({
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
            )}
          </div>
          <div className="section-rule" role="separator">
            <span>Over time</span>
            <span className="section-rule-note">{month ? "not limited to the month above" : "all the data there is"}</span>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card rise min-w-0 p-5" style={{ "--d": "160ms" } as React.CSSProperties}>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-medium text-ink2">Spend trend</h2>
                <div className="span-picker ml-auto" role="group" aria-label="Group spend by">
                  <button
                    type="button"
                    onClick={() => setTrendBy("billed")}
                    aria-pressed={trendBy === "billed"}
                    title="Grouped by the statement that billed each charge"
                    className={trendBy === "billed" ? "is-on" : ""}
                  >
                    Billed
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendBy("charged")}
                    aria-pressed={trendBy === "charged"}
                    title="Grouped by the day each charge was made"
                    className={trendBy === "charged" ? "is-on" : ""}
                  >
                    Charged
                  </button>
                </div>
                <div className="span-picker" role="group" aria-label="How far the trend looks back">
                  {([3, 6, 12] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTrendSpan(n)}
                      aria-pressed={trendSpan === n}
                      className={trendSpan === n ? "is-on" : ""}
                    >
                      {n === 12 ? "1 year" : `${n}m`}
                    </button>
                  ))}
                </div>
              </div>
              {timeline ? (
                <TrendChart
                  data={trendRun.map((m) => ({ month: m.month, debits: Number(m.debits) }))}
                  highlight={trendBy === "billed" ? month ?? undefined : undefined}
                />
              ) : (
                <div className="shimmer h-[240px] w-full" />
              )}
            </div>
            {timeline ? (
              <Subscriptions subs={timeline.subscriptions} />
            ) : (
              <div className="card min-w-0 p-5">
                <div className="shimmer h-4 w-24" />
                <div className="shimmer mt-2 h-6 w-32" />
                <div className="mt-3.5 space-y-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="shimmer h-[46px] w-full" />
                  ))}
                </div>
              </div>
            )}

            {/* The spend trend says how much; this says what it went on, on
                the same basis and over the same run. */}
            <div className="card rise min-w-0 p-5 lg:col-span-2" style={{ "--d": "240ms" } as React.CSSProperties}>
              <div className="mb-4 flex flex-wrap items-baseline gap-2">
                <h2 className="text-sm font-medium text-ink2">Where it went, month by month</h2>
                <span className="text-xs text-muted">
                  {trendBy === "billed" ? "grouped by the statement that billed it" : "grouped by the day it was charged"}
                </span>
              </div>
              {timeline ? (
                <CategoryTrend
                  data={(trendBy === "billed" ? timeline.byCategoryStatementMonth : timeline.byCategoryMonth)
                    .filter((r) => recentMonths.has(r.month))
                    .map((r) => ({ month: r.month, category: r.category, debits: Number(r.debits) }))}
                />
              ) : (
                <>
                  <div className="shimmer h-[260px] w-full" />
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="shimmer h-[24px] w-[92px]" />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
