"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { inr, monthLabel } from "@/lib/format";
import { useChartTokens } from "@/lib/chartTokens";

export default function TrendChart({ data }: { data: { month: string; debits: number }[] }) {
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
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            cursor={{ fill: t.grid, fillOpacity: 0.45 }}
            contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 10, color: t.ink, fontSize: 13 }}
            formatter={(v) => [inr(Number(v)), "Spend"]}
            labelStyle={{ color: t.muted }}
          />
          <Bar dataKey="debits" fill={t.series[0]} radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
