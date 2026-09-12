"use client";

import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { axisTick, inr, monthLabel } from "@/lib/format";
import { categoryColor, useChartTokens } from "@/lib/chartTokens";

export interface CategoryPoint {
  month: string;
  category: string;
  debits: number;
}

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
  only,
}: {
  active?: boolean;
  label?: string;
  rows: Record<string, TipRow[]>;
  month?: string;
  only: Set<string>;
}) {
  if (!active || !month) return null;
  const list = (rows[month] ?? []).filter((r) => r.value > 0 && only.has(r.category));
  if (!list.length) return null;
  const total = list.reduce((a, r) => a + r.value, 0);
  return (
    <div className="cat-tip">
      <p className="cat-tip-head">
        <span>{label}</span>
        <span className="tabular">{inr(total)}</span>
      </p>
      <ul>
        {list.map((r) => (
          <li key={r.category}>
            <span className="cat-tip-dot" style={{ background: r.color }} aria-hidden />
            <span className="cat-tip-name">{r.category}</span>
            <span className="tabular cat-tip-amt">{inr(r.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Where the money went, month by month. One line per category with a point on
 * every month, so a category is read by following its own colour rather than
 * by judging the thickness of a band. Everything shows by default; a legend
 * chip then either drops that category or isolates it, depending on the mode.
 */
export default function CategoryTrend({ data, height = 260 }: { data: CategoryPoint[]; height?: number }) {
  const t = useChartTokens();
  /** "drop" hides what you click, "only" keeps what you click. */
  const [mode, setMode] = useState<"drop" | "only">("drop");
  const [picked, setPicked] = useState<string[]>([]);

  const { months, categories, rows, tips } = useMemo(() => {
    const monthList = [...new Set(data.map((d) => d.month))].sort();
    const totals = new Map<string, number>();
    for (const d of data) totals.set(d.category, (totals.get(d.category) ?? 0) + Number(d.debits));
    // Biggest first, except Other, which is the bucket everything else fell
    // into and belongs at the end however large it is.
    const order = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c)
      .sort((a, b) => Number(a === "Other") - Number(b === "Other"));

    const cell = new Map<string, number>();
    for (const d of data) cell.set(`${d.month}|${d.category}`, Number(d.debits));

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
    return { months: monthList, categories: order, rows: built, tips: tipRows };
  }, [data, t]);

  if (!months.length) return <p className="py-10 text-center text-sm text-muted">No spend in this run.</p>;

  const filtered = picked.length > 0;
  const shown =
    mode === "only" && filtered ? categories.filter((c) => picked.includes(c)) : categories.filter((c) => !picked.includes(c));
  const isOff = (c: string) => (mode === "only" ? filtered && !picked.includes(c) : picked.includes(c));
  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const changeMode = (next: "drop" | "only") => {
    setMode(next);
    setPicked([]);
  };

  return (
    <div>
      <div className="chart-grow">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={rows} margin={{ top: 10, right: 14, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={t.grid} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: t.axis }}
              tick={{ fill: t.muted, fontSize: 12 }}
              padding={{ left: 16, right: 16 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fill: t.muted, fontSize: 12 }}
              tickFormatter={axisTick}
            />
            <Tooltip
              cursor={{ stroke: t.axis, strokeWidth: 1 }}
              content={({ active, label, payload }) => (
                <Tip
                  active={active}
                  label={String(label ?? "")}
                  rows={tips}
                  month={payload?.[0]?.payload?.month as string | undefined}
                  only={new Set(shown)}
                />
              )}
            />
            {shown.map((c) => (
              <Line
                key={c}
                type="linear"
                dataKey={c}
                stroke={categoryColor(c, t)}
                strokeWidth={2}
                dot={{ r: 3, fill: categoryColor(c, t), stroke: "none" }}
                activeDot={{ r: 5, fill: categoryColor(c, t), stroke: t.surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="cat-legend">
        <div className="span-picker" role="group" aria-label="What clicking a category does">
          <button
            type="button"
            onClick={() => changeMode("drop")}
            aria-pressed={mode === "drop"}
            title="Click a category to take it off the chart"
            className={mode === "drop" ? "is-on" : ""}
          >
            Drop
          </button>
          <button
            type="button"
            onClick={() => changeMode("only")}
            aria-pressed={mode === "only"}
            title="Click a category to show only that one"
            className={mode === "only" ? "is-on" : ""}
          >
            Only
          </button>
        </div>
        {filtered && (
          <button type="button" onClick={() => setPicked([])} className="cat-reset">
            Show all
          </button>
        )}
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => toggle(c)}
            aria-pressed={!isOff(c)}
            title={mode === "only" ? `Show only ${c}` : `Hide ${c}`}
            className={`cat-chip ${isOff(c) ? "is-off" : ""}`}
          >
            <span className="cat-chip-dot" style={{ background: categoryColor(c, t) }} aria-hidden />
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
