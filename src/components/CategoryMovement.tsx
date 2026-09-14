"use client";

import { useMemo } from "react";
import { inr, monthLabel } from "@/lib/format";
import { categoryColor, useChartTokens } from "@/lib/chartTokens";

export interface CategoryPoint {
  month: string;
  category: string;
  debits: number;
}

interface Row {
  category: string;
  values: number[];
  now: number;
  before: number | null;
  total: number;
}

function Change({ now, before }: { now: number; before: number | null }) {
  if (before === null) return <span className="text-muted">first month</span>;
  const diff = now - before;
  if (Math.abs(diff) < 1) return <span className="text-muted">no change</span>;
  const up = diff > 0;
  return (
    <>
      <span className={up ? "text-bad" : "text-good"}>
        {up ? "▲" : "▼"} {inr(Math.abs(diff))}
      </span>
      <span className="cat-row-pct text-muted">
        {before === 0 ? "new" : `${Math.round((Math.abs(diff) / before) * 100)}%`}
      </span>
    </>
  );
}

/**
 * What changed, one row per category. Every row draws its recent months on its
 * own scale, so a small category's swings read as clearly as a large one's.
 */
export default function CategoryMovement({ data, months: run }: { data: CategoryPoint[]; months: string[] }) {
  const t = useChartTokens();

  const { months, rows } = useMemo(() => {
    const monthList = [...run].sort();
    const cell = new Map<string, number>();
    for (const d of data) {
      const key = `${d.month}|${d.category}`;
      cell.set(key, (cell.get(key) ?? 0) + Number(d.debits));
    }
    const list: Row[] = [...new Set(data.map((d) => d.category))]
      .map((category) => {
        const values = monthList.map((m) => cell.get(`${m}|${category}`) ?? 0);
        return {
          category,
          values,
          now: values[values.length - 1] ?? 0,
          before: values.length > 1 ? values[values.length - 2] : null,
          total: values.reduce((a, v) => a + v, 0),
        };
      })
      .filter((r) => r.total > 0);
    // Biggest this month first. Other is the leftover bucket and goes last.
    list.sort(
      (a, b) =>
        Number(a.category === "Other") - Number(b.category === "Other") || b.now - a.now || b.total - a.total
    );
    return { months: monthList, rows: list };
  }, [data, run]);

  if (!rows.length) return <p className="py-10 text-center text-sm text-muted">No spend in these months.</p>;

  const latest = months[months.length - 1];
  const prev = months.length > 1 ? months[months.length - 2] : null;

  return (
    <ul className="cat-rows">
      <li className="cat-row cat-row-head text-muted" aria-hidden>
        <span>Category</span>
        <span className="cat-row-span">
          {months.length > 1 ? `${monthLabel(months[0])} to ${monthLabel(latest)}` : monthLabel(latest)}
        </span>
        <span className="cat-row-amt">{monthLabel(latest)}</span>
        <span className="cat-row-chg">{prev ? `vs ${monthLabel(prev)}` : "Change"}</span>
      </li>
      {rows.map((r) => {
        const color = categoryColor(r.category, t);
        const peak = Math.max(...r.values);
        const byMonth = months.map((m, i) => `${monthLabel(m)}: ${inr(r.values[i])}`);
        return (
          <li key={r.category} className="cat-row">
            <span className="cat-row-name">
              <span className="cat-row-dot" style={{ background: color }} aria-hidden />
              <span className="truncate text-ink">{r.category}</span>
            </span>
            <span
              className="cat-bars hint"
              tabIndex={0}
              data-hint={byMonth.join("\n")}
              aria-label={`${r.category}. ${byMonth.join(", ")}`}
            >
              {r.values.map((v, i) => (
                <span
                  key={months[i]}
                  className={`cat-bar${i === months.length - 1 ? " is-latest" : ""}${v <= 0 ? " is-zero" : ""}`}
                  style={
                    {
                      "--bar": color,
                      "--k": i,
                      height: v > 0 ? `${Math.max(8, (v / peak) * 100)}%` : undefined,
                    } as React.CSSProperties
                  }
                />
              ))}
            </span>
            <span className="cat-row-amt tabular text-ink">{inr(r.now)}</span>
            <span className="cat-row-chg tabular">
              <Change now={r.now} before={r.before} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
