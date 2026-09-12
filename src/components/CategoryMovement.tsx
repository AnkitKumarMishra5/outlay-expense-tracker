"use client";

import { motion } from "motion/react";
import { inr } from "@/lib/format";
import { categoryColor, useChartTokens } from "@/lib/chartTokens";

interface Row {
  category: string;
  now: number;
  before: number;
  delta: number;
}

/** Categories ranked by how far they moved since last month. */
export default function CategoryMovement({
  now,
  before,
  monthLabel,
}: {
  now: { category: string; total: number }[];
  before: { category: string; total: number }[];
  /** What the earlier month is called, for the column heading. */
  monthLabel: string;
}) {
  const tokens = useChartTokens();
  const prev = new Map(before.map((r) => [r.category, Number(r.total)]));
  const seen = new Set<string>();
  const rows: Row[] = [];

  for (const r of now) {
    const value = Number(r.total);
    const was = prev.get(r.category) ?? 0;
    seen.add(r.category);
    rows.push({ category: r.category, now: value, before: was, delta: value - was });
  }
  // A category that stopped entirely is still a change.
  for (const [category, was] of prev) {
    if (!seen.has(category) && was > 0) rows.push({ category, now: 0, before: was, delta: -was });
  }

  const moved = rows.filter((r) => Math.abs(r.delta) >= 1).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  if (!moved.length) return null;

  const widest = Math.max(...moved.map((r) => Math.abs(r.delta)));
  const shown = moved.slice(0, 6);
  const total = moved.reduce((a, r) => a + r.delta, 0);

  return (
    <div className="min-w-0">
      <p className="mv-summary">
        {total === 0 ? (
          "Spend is level with last month."
        ) : (
          <>
            <span className={total > 0 ? "text-warn" : "text-good"}>
              {total > 0 ? "↑" : "↓"} {inr(Math.abs(total))}
            </span>{" "}
            <span className="text-ink2">{total > 0 ? "more" : "less"} than {monthLabel}</span>
          </>
        )}
      </p>

      <ul className="mv-list">
        {shown.map((r, i) => {
          const up = r.delta > 0;
          const pct = r.before > 0 ? Math.round((r.delta / r.before) * 100) : null;
          return (
            <li key={r.category} className="mv-row">
              <span className="mv-name">
                <span className="mv-dot" style={{ background: categoryColor(r.category, tokens) }} aria-hidden />
                <span className="truncate">{r.category}</span>
              </span>
              <span className="mv-track" aria-hidden>
                <span className="mv-axis" />
                <motion.span
                  className={`mv-bar ${up ? "is-up" : "is-down"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(1.5, (Math.abs(r.delta) / widest) * 50)}%` }}
                  transition={{ type: "spring", stiffness: 190, damping: 26, delay: i * 0.05 }}
                />
              </span>

              <span className={`mv-delta tabular ${up ? "text-warn" : "text-good"}`}>
                {up ? "+" : "−"}
                {inr(Math.abs(r.delta))}
                {pct !== null && Math.abs(pct) < 1000 && <span className="mv-pct">{Math.abs(pct)}%</span>}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mv-foot">
        {shown[0].category} accounts for the largest part of the change.
        {moved.length > shown.length && ` ${moved.length - shown.length} smaller movements are not shown.`}
      </p>
    </div>
  );
}
