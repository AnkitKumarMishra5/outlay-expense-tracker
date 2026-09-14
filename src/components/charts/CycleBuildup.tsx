"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisTick, inr } from "@/lib/format";
import { useChartTokens } from "@/lib/chartTokens";

interface Row {
  day: string;
  charged: number;
  total: number;
}

const short = (day: string) =>
  new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function Tip({ active, row, bill }: { active?: boolean; row?: Row; bill: number }) {
  if (!active || !row) return null;
  return (
    <div className="cat-tip">
      <p className="cat-tip-head">
        <span>{short(row.day)}</span>
        <span className="tabular">{inr(row.total)}</span>
      </p>
      <p className="text-[11.5px] text-ink2">
        <span className="tabular text-ink">+{inr(row.charged)}</span> that date
        {bill > 0 && <span className="text-muted"> · {Math.round((row.charged / bill) * 100)}% of the bill</span>}
      </p>
    </div>
  );
}

/**
 * How the bill grew across the cycle. The line is the running total with a
 * point on every date something was charged, the bars underneath are what each
 * of those dates added on the same scale.
 */
export default function CycleBuildup({ data }: { data: { day: string; debits: number }[] }) {
  const t = useChartTokens();
  if (data.length < 2) return <p className="py-14 text-center text-xs text-muted">Not enough days to plot yet.</p>;

  const rows = [...data]
    .sort((a, b) => a.day.localeCompare(b.day))
    .reduce<Row[]>((acc, d) => {
      const before = acc.length ? acc[acc.length - 1].total : 0;
      acc.push({ day: d.day, charged: Number(d.debits), total: Math.round((before + Number(d.debits)) * 100) / 100 });
      return acc;
    }, []);

  const bill = rows[rows.length - 1].total;
  const jump = rows.reduce((best, r) => (r.charged > best.charged ? r : best), rows[0]);
  const half = rows.find((r) => r.total >= bill / 2) ?? rows[rows.length - 1];
  const spanDays =
    Math.round((Date.parse(`${rows[rows.length - 1].day}T00:00:00`) - Date.parse(`${rows[0].day}T00:00:00`)) / 86_400_000) + 1;
  const spendDates = rows.filter((r) => r.charged > 0).length;

  return (
    <div>
      <div className="chart-grow">
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={rows} margin={{ top: 24, right: 12, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={t.grid} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: t.axis }}
              tick={{ fill: t.muted, fontSize: 11 }}
              tickFormatter={(d: string) => String(Number(d.slice(8)))}
              minTickGap={14}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fill: t.muted, fontSize: 11 }}
              tickFormatter={axisTick}
            />
            <Tooltip
              cursor={{ stroke: t.axis, strokeDasharray: "3 3" }}
              content={({ active, payload }) => (
                <Tip active={active} row={payload?.[0]?.payload as Row | undefined} bill={bill} />
              )}
            />
            <ReferenceLine
              x={half.day}
              stroke={t.muted}
              strokeOpacity={0.6}
              strokeDasharray="3 4"
              label={{ value: "half the bill", position: "insideTopLeft", fill: t.muted, fontSize: 10, dy: -18 }}
            />
            <Bar
              dataKey="charged"
              fill={t.series[0]}
              fillOpacity={0.32}
              radius={[3, 3, 0, 0]}
              maxBarSize={12}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke={t.series[0]}
              strokeWidth={2.25}
              dot={{ r: 3, fill: t.series[0], stroke: t.surface, strokeWidth: 1.5 }}
              activeDot={{ r: 5.5, fill: t.series[0], stroke: t.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs leading-snug">
        <div className="rounded-lg border border-line bg-surface2 px-2.5 py-2 sm:px-3">
          <dt className="whitespace-nowrap text-[11px] text-muted sm:text-xs">Biggest jump</dt>
          <dd className="mt-0.5 tabular text-ink">+{inr(jump.charged)}</dd>
          <dd className="text-[10.5px] text-muted">{short(jump.day)}</dd>
        </div>
        <div className="rounded-lg border border-line bg-surface2 px-2.5 py-2 sm:px-3">
          <dt className="whitespace-nowrap text-[11px] text-muted sm:text-xs">Half by</dt>
          <dd className="mt-0.5 tabular text-ink">{short(half.day)}</dd>
          <dd className="text-[10.5px] tabular text-muted">of {inr(bill)}</dd>
        </div>
        <div className="rounded-lg border border-line bg-surface2 px-2.5 py-2 sm:px-3">
          <dt className="whitespace-nowrap text-[11px] text-muted sm:text-xs">Spend dates</dt>
          <dd className="mt-0.5 tabular text-ink">{spendDates}</dd>
          <dd className="text-[10.5px] text-muted">{spanDays}-day cycle</dd>
        </div>
      </dl>
    </div>
  );
}
