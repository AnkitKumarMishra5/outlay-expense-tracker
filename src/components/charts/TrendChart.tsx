"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { axisTick, inr, monthLabel } from "@/lib/format";
import { useChartTokens } from "@/lib/chartTokens";

export default function TrendChart({
  data,
  highlight,
}: {
  data: { month: string; debits: number }[];
  /** The month the rest of the page is showing, picked out of the run. */
  highlight?: string;
}) {
  const t = useChartTokens();
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.month) }));
  return (
    <div className="chart-grow">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={t.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: t.axis }} tick={{ fill: t.muted, fontSize: 12 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fill: t.muted, fontSize: 12 }}
            tickFormatter={axisTick}
          />
          <Tooltip
            cursor={{ fill: t.grid, fillOpacity: 0.45 }}
            contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 10, color: t.ink, fontSize: 13 }}
            formatter={(v) => [inr(Number(v)), "Spend"]}
            labelStyle={{ color: t.muted }}
          />
          <Bar dataKey="debits" radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell
                key={r.month}
                fill={t.series[0]}
                // The month on screen stands out; the rest are the run it sits in.
                fillOpacity={highlight && r.month !== highlight ? 0.32 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
