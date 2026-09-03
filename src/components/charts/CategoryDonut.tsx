"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { inr } from "@/lib/format";
import { categoryColor, useChartTokens } from "@/lib/chartTokens";

interface Slice {
  category: string;
  total: number;
}

export default function CategoryDonut({ data }: { data: Slice[] }) {
  const t = useChartTokens();
  const [active, setActive] = useState<number | null>(null);

  const top = data.slice(0, 7);
  const rest = data.slice(7).reduce((a, d) => a + Number(d.total), 0);
  const slices = top.map((d) => ({
    name: d.category,
    value: Number(d.total),
    color: categoryColor(d.category, t),
  }));
  if (rest > 0) {
    const existing = slices.find((s) => s.name === "Other");
    if (existing) existing.value += rest;
    else slices.push({ name: "Other", value: rest, color: t.other });
  }
  const total = slices.reduce((a, s) => a + s.value, 0);
  if (!total) return <p className="py-10 text-center text-sm text-muted">No spend in this period.</p>;

  const shown = active !== null ? slices[active] : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="spin-in relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive={false}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {slices.map((s, i) => (
                <Cell
                  key={s.name}
                  fill={s.color}
                  className="slice"
                  opacity={active === null || active === i ? 1 : 0.3}
                  style={{ cursor: "pointer", transform: active === i ? "scale(1.06)" : "scale(1)" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span key={shown ? shown.name : "total"} className="pop flex flex-col items-center">
            <span className="max-w-[6.5rem] truncate text-[11px] text-muted">{shown ? shown.name : "Total"}</span>
            <span className="text-sm font-semibold tabular">{inr(shown ? shown.value : total)}</span>
            {shown && (
              <span className="text-[11px] text-muted tabular">{Math.round((shown.value / total) * 100)}%</span>
            )}
          </span>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-1.5 text-sm">
        {slices.map((s, i) => (
          <li
            key={s.name}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className="tick-in row-hover flex cursor-default items-center gap-2 rounded px-1 py-0.5"
            style={
              {
                opacity: active === null || active === i ? 1 : 0.45,
                "--d": `${180 + i * 70}ms`,
              } as React.CSSProperties
            }
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm transition-transform duration-200"
              style={{ background: s.color, transform: active === i ? "scale(1.45)" : "none" }}
            />
            <span className="truncate text-ink2">{s.name}</span>
            <span className="ml-auto tabular">{inr(s.value)}</span>
            <span className="w-10 text-right text-xs text-muted tabular">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
