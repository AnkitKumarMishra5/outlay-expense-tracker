"use client";

import { motion } from "motion/react";
import { inr } from "@/lib/format";
import { categoryColor, useChartTokens } from "@/lib/chartTokens";
import { Analytics } from "@/lib/types";

/**
 * Where the money actually went. A category tells you "Shopping, ₹36,835";
 * this tells you it was Amazon. Ranked by spend for the chosen range.
 */
export default function TopMerchants({ rows }: { rows: Analytics["byMerchant"] }) {
  const t = useChartTokens();
  const top = rows.slice(0, 6);
  const peak = Math.max(1, ...top.map((r) => Number(r.total)));

  if (!top.length) {
    return <p className="py-6 text-center text-xs text-muted">No spend to rank yet.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {top.map((r, i) => {
        const total = Number(r.total);
        const share = Math.max(0.03, total / peak);
        const colour = categoryColor(r.category, t);
        return (
          <li key={r.merchant}>
            <p className="flex items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-ink">{r.merchant}</span>
              <span className="tabular shrink-0 text-ink2">{inr(total)}</span>
            </p>
            <span className="mt-1 flex items-center gap-2">
              <span className="merch-track">
                <motion.span
                  className="merch-fill"
                  style={{ background: colour }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: share }}
                  transition={{ type: "spring", stiffness: 160, damping: 26, delay: 0.05 * i }}
                />
              </span>
              <span className="shrink-0 text-[10px] tabular text-muted">
                {r.n} {r.n === 1 ? "charge" : "charges"}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
