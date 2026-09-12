"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisTick, inr } from "@/lib/format";
import { useChartTokens } from "@/lib/chartTokens";

/** How the bill accumulated across the cycle, day by day. */
export default function CycleBuildup({ data }: { data: { day: string; debits: number }[] }) {
  const t = useChartTokens();
  if (data.length < 2) return <p className="py-14 text-center text-xs text-muted">Not enough days to plot yet.</p>;

  const sorted = [...data].sort((a, b) => a.day.localeCompare(b.day));
  const rows = sorted.map((d, i) => ({
    day: d.day,
    label: d.day.slice(8),
    charged: Number(d.debits),
    total: Math.round(sorted.slice(0, i + 1).reduce((a, x) => a + Number(x.debits), 0) * 100) / 100,
  }));

  return (
    <div className="chart-grow">
      <ResponsiveContainer width="100%" height={232}>
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="buildup" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t.series[0]} stopOpacity={0.42} />
              <stop offset="100%" stopColor={t.series[0]} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={t.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: t.axis }} tick={{ fill: t.muted, fontSize: 11 }} minTickGap={18} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fill: t.muted, fontSize: 11 }}
            tickFormatter={axisTick}
          />
          <Tooltip
            cursor={{ stroke: t.line }}
            contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 10, color: t.ink, fontSize: 13 }}
            labelFormatter={(_, p) => p?.[0]?.payload?.day ?? ""}
            formatter={(v, _n, p) => [
              `${inr(Number(v))} · ${inr(Number(p?.payload?.charged ?? 0))} that day`,
              "Running total",
            ]}
            labelStyle={{ color: t.muted }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={t.series[0]}
            strokeWidth={2}
            fill="url(#buildup)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
