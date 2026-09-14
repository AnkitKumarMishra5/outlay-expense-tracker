"use client";

import { motion } from "motion/react";
import BankBadge from "./BankBadge";
import { inr } from "@/lib/format";
import { categoryColor, useChartTokens } from "@/lib/chartTokens";
import type { Analytics } from "@/lib/types";

type Row = Analytics["biggest"][number];

/** This period's charges, largest first. */
export default function LargestCharges({ rows, billed, allTime = false }: { rows: Row[]; billed: number; allTime?: boolean }) {
  const tokens = useChartTokens();
  if (!rows.length) return <p className="py-6 text-center text-xs text-muted">No charges in this period.</p>;

  const top = Number(rows[0].amount);
  const total = rows.reduce((a, r) => a + Number(r.amount), 0);
  const share = (amount: number) => {
    const pct = (amount / billed) * 100;
    return pct < 1 ? "<1%" : `${Math.round(pct)}%`;
  };

  return (
    <div className="min-w-0">
      <ul className="big-list">
        {rows.map((r, i) => {
          const amount = Number(r.amount);
          return (
            <li key={r.id} className="big-row">
              <span className="big-rank tabular">{i + 1}</span>
              <BankBadge bankId={r.bank_id} size={22} />
              <span className="big-main">
                <span className="big-desc">{r.description}</span>
                <span className="big-meta">
                  <span className="big-dot" style={{ background: categoryColor(r.category, tokens) }} aria-hidden />
                  {r.category}
                  <span className="text-muted"> · {r.txn_date}</span>
                  {r.is_fee === 1 && <span className="big-flag is-fee">fee</span>}
                  {r.is_international === 1 && <span className="big-flag">intl</span>}
                </span>
                <motion.span
                  className="big-bar"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, (amount / top) * 100)}%` }}
                  transition={{ type: "spring", stiffness: 190, damping: 26, delay: i * 0.04 }}
                  aria-hidden
                />
              </span>
              <span className="big-amount tabular">
                {inr(amount)}
                {billed > 0 && (
                  <span className="big-share">
                    {share(amount)}
                    <span className="big-share-word"> of spends</span>
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="big-foot">
        These {rows.length} charges come to <span className="tabular text-ink2">{inr(total)}</span>
        {billed > 0 && (
          <>
            , which is <span className="text-ink2">{Math.round((total / billed) * 100)}%</span> of{" "}
            {allTime ? "the " : "this cycle's "}
            <span className="tabular text-ink2">{inr(billed)}</span> {allTime ? "spent across all statements" : "spends"}
          </>
        )}
        .
      </p>
    </div>
  );
}
