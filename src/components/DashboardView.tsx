"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import MonthPicker from "./MonthPicker";
import { billCycle, billMonth, today as billToday } from "@/lib/bills";

import CardRail, { type CardStat } from "@/components/CardRail";
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
import { inr, shiftMonth } from "@/lib/format";
import { Analytics, CardRow, Timeline } from "@/lib/types";


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

  const money = (n: number) => inr(n);

  const cycle = billCycle(data.dues ?? [], billToday(), month ?? undefined);

  // Statements, not the calendar: a statement dated 12 August bills a cycle
  // that opened in July, so its charges carry July dates.
  // The statement month on screen and the five before it, oldest first.
  const recentMonths = month ? [5, 4, 3, 2, 1, 0].map((back) => shiftMonth(month, -back)) : [];
  const billedSpend = cycle.current.reduce((a, b) => a + Number(b.total_debits ?? 0), 0);
  const totalDue = cycle.billed;
  // The credit rows themselves, less paying the card: refunds, reversals, cashback.
  const refunds =
    data.totals.payments === undefined ? 0 : Math.max(0, Number(data.totals.credits) - Number(data.totals.payments));
  // What last cycle left on these cards once it was paid: unpaid (positive) or
  // in credit (negative). Derived so the strip always adds up, whichever of
  // refunds and carry-over a cycle has, or both.
  const carriedRaw = totalDue - billedSpend + refunds;
  // Banks round each bill to whole rupees, which leaves paise here on a cycle
  // that was otherwise paid in full.
  const rounding = Math.abs(carriedRaw) < 1;
  const carried = rounding ? 0 : carriedRaw;

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
    /** A quiet second line under the figure. */
    detail?: string;
    detailTone?: "good" | "bad";
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
      label: "Spends",
      value: billedSpend,
      fmt: money,
      tone: "spend" as const,
      op: "\u2212",
      opLabel: "minus",
      detail: fees > 0 ? `incl. ${money(fees)} fees` : "no fees",
      detailTone: fees > 0 ? ("bad" as const) : undefined,
      hint: `Charges on the statements in this period, fees included. A statement dated the 12th bills a cycle that began in the previous month, so this is not the same as spend by calendar date.\n\nFees and charges:\n${feeList}`,
    },
    {
      label: "Refunds & cashbacks",
      value: refunds,
      fmt: money,
      tone: refunds > 0 ? ("good" as const) : ("quiet" as const),
      op: carried < 0 ? "\u2212" : "+",
      opLabel: carried < 0 ? "minus" : "plus",
      hint: "What the cards gave back rather than charged: refunds, reversals and cashback. Paying the card is not counted here.",
    },
    {
      label: "Carried over",
      value: Math.abs(carried),
      fmt: money,
      tone: carried > 0 ? ("bad" as const) : carried < 0 ? ("good" as const) : ("quiet" as const),
      detail: carried > 0 ? "unpaid from last cycle" : carried < 0 ? "in credit from last cycle" : undefined,
      detailTone: carried > 0 ? ("bad" as const) : carried < 0 ? ("good" as const) : undefined,
      hint:
        carried > 0
          ? "Part of last cycle's bill was not cleared, so it has rolled into this one and is being billed again."
          : carried < 0
            ? "Last cycle was overpaid or ended in credit, and that credit comes off this bill."
            : rounding && Math.abs(carriedRaw) >= 0.005
              ? `Last cycle was cleared in full. The ${money(Math.abs(carriedRaw))} left over is each bank rounding its bill to whole rupees.`
              : "Last cycle was cleared in full, so nothing rolled into this bill.",
    },
    {
      label: "Transactions",
      value: Number(data.totals.txns),
      fmt: (n: number) => String(Math.round(n)),
      tone: "quiet" as const,
      detail:
        data.totals.spend_txns !== undefined
          ? `${plural(Number(data.totals.spend_txns), "spend")} · ${plural(Number(data.totals.credit_txns ?? 0), "credit")}`
          : undefined,
    },
  ];

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
                {s.detail && (
                  <p
                    className={`stat-cell-detail tabular ${
                      s.detailTone === "bad" ? "text-bad" : s.detailTone === "good" ? "text-good" : "text-muted"
                    }`}
                  >
                    {s.detail}
                  </p>
                )}
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
                  <div className="shimmer h-[292px] w-full" />
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
              <h2 className="mb-4 text-sm font-medium text-ink2">What changed</h2>
              {timeline ? (
                <CategoryMovement
                  key={viewKey}
                  months={recentMonths}
                  data={timeline.byCategoryStatementMonth
                    .filter((r) => recentMonths.includes(r.month))
                    .map((r) => ({ month: r.month, category: r.category, debits: Number(r.debits) }))}
                />
              ) : (
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="shimmer h-[34px] w-full" />
                  ))}
                </div>
              )}
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
              // A statement month shows its own bills, plus an earlier one only
              // while it is still unpaid. A settled bill stays with its month.
              dues={(data.dues ?? [])
                .filter((d) => !month || billMonth(d) === month || (billMonth(d) < month && !d.settled))
                .map((d) => ({
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
              statementMonth={month}
            />
            )}
          </div>
          <div className="section-rule" role="separator">
            <span>Over time</span>
            <span className="section-rule-note">{month ? "not limited to the month above" : "all the data there is"}</span>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <SpendTrendPanel timeline={timeline} month={month} />
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

            <CategoryTrendPanel timeline={timeline} />
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

type Span = 3 | 6 | 12;
type GroupBy = "charged" | "billed";

/** The months a panel is showing, on the basis it groups by. */
function runOf(timeline: Timeline, by: GroupBy, span: Span) {
  return (by === "billed" ? timeline.byStatementMonth : timeline.byMonth).slice(-span);
}

/**
 * Each Over time panel owns its controls. Keeping that state inside the panel
 * means a click in one re-renders only that panel, and memo keeps the others
 * still while the dashboard around them updates.
 */
const SpendTrendPanel = memo(function SpendTrendPanel({
  timeline,
  month,
}: {
  timeline: Timeline | null;
  month: string | null | undefined;
}) {
  const [span, setSpan] = useState<Span>(6);
  // The same money lands in different months depending on which date you group
  // by: the day it was charged, or the statement that billed it.
  const [by, setBy] = useState<GroupBy>("billed");
  const data = useMemo(
    () => (timeline ? runOf(timeline, by, span).map((m) => ({ month: m.month, debits: Number(m.debits) })) : []),
    [timeline, by, span]
  );
  return (
    <div className="card rise min-w-0 p-5" style={{ "--d": "160ms" } as React.CSSProperties}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-medium text-ink2">Spend trend</h2>
        <RunControls by={by} onBy={setBy} span={span} onSpan={setSpan} />
      </div>
      {timeline ? (
        <TrendChart data={data} highlight={by === "billed" ? month ?? undefined : undefined} />
      ) : (
        <div className="shimmer h-[240px] w-full" />
      )}
    </div>
  );
});

const CategoryTrendPanel = memo(function CategoryTrendPanel({ timeline }: { timeline: Timeline | null }) {
  const [span, setSpan] = useState<Span>(6);
  const [by, setBy] = useState<GroupBy>("billed");
  const { data, months } = useMemo(() => {
    if (!timeline) return { data: [], months: [] };
    const run = runOf(timeline, by, span).map((m) => m.month);
    const keep = new Set(run);
    return {
      months: run,
      data: (by === "billed" ? timeline.byCategoryStatementMonth : timeline.byCategoryMonth)
        .filter((r) => keep.has(r.month))
        .map((r) => ({ month: r.month, category: r.category, debits: Number(r.debits) })),
    };
  }, [timeline, by, span]);
  return (
    <div className="card rise min-w-0 p-5 lg:col-span-2" style={{ "--d": "240ms" } as React.CSSProperties}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-medium text-ink2">Where it went, month by month</h2>
        <RunControls by={by} onBy={setBy} span={span} onSpan={setSpan} />
      </div>
      {timeline ? (
        <CategoryTrend data={data} months={months} />
      ) : (
        <>
          <div className="shimmer h-[280px] w-full" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="shimmer h-[24px] w-[92px]" />
            ))}
          </div>
        </>
      )}
    </div>
  );
});

/** Which date groups the money, and how far back to look. */
function RunControls({
  by,
  onBy,
  span,
  onSpan,
}: {
  by: GroupBy;
  onBy: (next: GroupBy) => void;
  span: Span;
  onSpan: (next: Span) => void;
}) {
  return (
    <>
      <div className="span-picker ml-auto" role="group" aria-label="Group spend by">
        <button
          type="button"
          onClick={() => onBy("billed")}
          aria-pressed={by === "billed"}
          title="Grouped by the statement that billed each charge"
          className={by === "billed" ? "is-on" : ""}
        >
          Billed
        </button>
        <button
          type="button"
          onClick={() => onBy("charged")}
          aria-pressed={by === "charged"}
          title="Grouped by the day each charge was made"
          className={by === "charged" ? "is-on" : ""}
        >
          Charged
        </button>
      </div>
      <div className="span-picker" role="group" aria-label="How far back to look">
        {([3, 6, 12] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onSpan(n)}
            aria-pressed={span === n}
            className={span === n ? "is-on" : ""}
          >
            {n === 12 ? "1 year" : `${n}m`}
          </button>
        ))}
      </div>
    </>
  );
}
