"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { axisTick, inr, monthLabel } from "@/lib/format";
import { categoryColor, useChartTokens } from "@/lib/chartTokens";

export interface CategoryPoint {
  month: string;
  category: string;
  debits: number;
}

/** Round axis steps (1, 2, 2.5 or 5 times a power of ten), so labels read 50k, 1L, 1.5L. */
function niceTicks(peak: number, count = 4) {
  if (peak <= 0) return [0, 1];
  const raw = peak / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((x) => x >= raw) ?? 10 * pow;
  const top = Math.ceil(peak / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

/** A busy month lists its biggest categories and folds the rest into one line. */
const TIP_ROWS = 8;

interface TipRow {
  category: string;
  value: number;
  color: string;
}

function Tip({
  active,
  label,
  rows,
  month,
  focus,
}: {
  active?: boolean;
  label?: string;
  rows: Record<string, TipRow[]>;
  month?: string;
  focus: string | null;
}) {
  if (!active || !month) return null;
  const list = (rows[month] ?? []).filter((r) => r.value > 0 && (!focus || r.category === focus));
  if (!list.length) return null;
  const total = list.reduce((a, r) => a + r.value, 0);
  const rest = list.slice(TIP_ROWS);
  return (
    <div className="cat-tip">
      <p className="cat-tip-head">
        <span>{label}</span>
        <span className="tabular">{inr(total)}</span>
      </p>
      <ul>
        {list.slice(0, TIP_ROWS).map((r) => (
          <li key={r.category}>
            <span className="cat-tip-dot" style={{ background: r.color }} aria-hidden />
            <span className="cat-tip-name">{r.category}</span>
            <span className="tabular cat-tip-amt">{inr(r.value)}</span>
          </li>
        ))}
      </ul>
      {rest.length > 0 && (
        <p className="mt-1.5 text-[11px] text-muted">
          +{rest.length} more · <span className="tabular">{inr(rest.reduce((a, r) => a + r.value, 0))}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Where the money went across the run: one column per month, stacked by
 * category with the biggest at the base and Other on top. Picking a category
 * lifts it out on its own scale, so a small one's trend reads clearly too.
 */
export default function CategoryTrend({
  data,
  months: run,
  height = 280,
}: {
  data: CategoryPoint[];
  months?: string[];
  height?: number;
}) {
  const t = useChartTokens();
  const [focus, setFocus] = useState<string | null>(null);

  const { categories, rows, tips } = useMemo(() => {
    const monthList = run?.length ? [...run].sort() : [...new Set(data.map((d) => d.month))].sort();
    const totals = new Map<string, number>();
    const cell = new Map<string, number>();
    for (const d of data) {
      totals.set(d.category, (totals.get(d.category) ?? 0) + Number(d.debits));
      const key = `${d.month}|${d.category}`;
      cell.set(key, (cell.get(key) ?? 0) + Number(d.debits));
    }
    const order = [...totals.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c)
      .sort((a, b) => Number(a === "Other") - Number(b === "Other"));

    const built = monthList.map((month) => {
      const row: Record<string, string | number> = { month, label: monthLabel(month) };
      for (const c of order) row[c] = cell.get(`${month}|${c}`) ?? 0;
      return row;
    });

    const tipRows: Record<string, TipRow[]> = {};
    for (const month of monthList) {
      tipRows[month] = order
        .map((c) => ({ category: c, value: cell.get(`${month}|${c}`) ?? 0, color: categoryColor(c, t) }))
        .sort((a, b) => b.value - a.value);
    }
    return { categories: order, rows: built, tips: tipRows };
  }, [data, run, t]);

  if (!categories.length) return <p className="py-10 text-center text-sm text-muted">No spend in this run.</p>;

  const active = focus && categories.includes(focus) ? focus : null;
  const shown = active ? [active] : categories;
  const ticks = niceTicks(Math.max(0, ...rows.map((r) => shown.reduce((a, c) => a + Number(r[c] ?? 0), 0))));

  return (
    <div>
      <div className="chart-grow">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={rows} margin={{ top: 10, right: 8, left: 8, bottom: 0 }} barCategoryGap="24%">
            <CartesianGrid vertical={false} stroke={t.grid} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: t.axis }}
              tick={{ fill: t.muted, fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              ticks={ticks}
              domain={[0, ticks[ticks.length - 1]]}
              width={52}
              tick={{ fill: t.muted, fontSize: 12 }}
              tickFormatter={axisTick}
            />
            <Tooltip
              cursor={{ fill: t.line }}
              content={({ active: on, label, payload }) => (
                <Tip
                  active={on}
                  label={String(label ?? "")}
                  rows={tips}
                  month={payload?.[0]?.payload?.month as string | undefined}
                  focus={active}
                />
              )}
            />
            {shown.map((c) => (
              <Bar
                key={c}
                dataKey={c}
                stackId="spend"
                fill={categoryColor(c, t)}
                stroke={t.surface}
                strokeWidth={active ? 0 : 1}
                maxBarSize={44}
                radius={active ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="cat-legend">
        <button
          type="button"
          onClick={() => setFocus(null)}
          aria-pressed={!active}
          className={`cat-chip ${active ? "is-off" : ""}`}
        >
          All categories
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFocus(active === c ? null : c)}
            aria-pressed={active === c}
            title={active === c ? "Back to all categories" : `Show only ${c}`}
            className={`cat-chip ${active && active !== c ? "is-off" : ""}`}
          >
            <span className="cat-chip-dot" style={{ background: categoryColor(c, t) }} aria-hidden />
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
