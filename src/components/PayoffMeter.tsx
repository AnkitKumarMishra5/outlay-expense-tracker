"use client";

import { useEffect, useState } from "react";
import { inr } from "@/lib/format";

const R = 30;
const C = 2 * Math.PI * R;

/** Where this cycle's bills stand. */
export default function PayoffMeter({
  period = "this cycle",
  bills,
  settled,
  billed,
  remaining = 0,
}: {
  /** One entry per bill in the cycle, flagged if it is past its date. */
  bills: { id: string; overdue: boolean }[];
  /** How the bills are scoped in words: "this cycle", or "across all statements". */
  period?: string;
  /** Money on bills marked settled in this cycle. */
  settled: number;
  billed: number;
  remaining?: number;
}) {
  const [drawn, setDrawn] = useState(0);
  const share = billed > 0 ? Math.min(1, settled / billed) : 0;

  // Held a frame so the arc sweeps in rather than appearing finished.
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(share));
    return () => cancelAnimationFrame(id);
  }, [share]);

  if (!bills.length || billed <= 0) return null;

  const total = bills.length;
  const done = total - remaining;
  const allClear = remaining === 0;
  const overdue = bills.filter((b) => b.overdue).length;
  const outstanding = Math.max(0, billed - settled);

  return (
    <div className={`payoff ${allClear ? "is-done" : ""} ${overdue > 0 ? "is-late" : ""}`}>
      {/* The count alone fills the ring; the word it counts sits under it,
          where it has room to be read. */}
      <div className="payoff-gauge">
        <div
          className="payoff-ring"
          role="img"
          aria-label={`${done} of ${total} bills settled, ${inr(outstanding)} outstanding`}
        >
          <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden>
            <circle className="payoff-ring-track" cx="36" cy="36" r={R} />
            <circle
              className="payoff-ring-arc"
              cx="36"
              cy="36"
              r={R}
              strokeDasharray={C}
              strokeDashoffset={C * (1 - drawn)}
            />
          </svg>
          <span className="payoff-ring-face">
            <span className="payoff-ring-count tabular">
              {done}
              <span className="payoff-ring-of">/{total}</span>
            </span>
          </span>
        </div>
        <span className="payoff-ring-word">settled</span>
      </div>

      <div className="payoff-side">
        {allClear ? (
          <>
            <p className="payoff-headline text-good">Every bill settled</p>
            <p className="payoff-sub">
              <span className="tabular">{inr(billed)}</span> across {total} bill{total === 1 ? "" : "s"} {period}
            </p>
          </>
        ) : (
          <>
            <p className="payoff-headline">
              <span className="tabular text-ink">{inr(outstanding)}</span>
              <span className="text-ink2"> outstanding</span>
            </p>
            <p className="payoff-sub">
              {remaining} of {total} bill{total === 1 ? "" : "s"} left
              {settled > 0 && (
                <>
                  <span className="text-muted"> · </span>
                  <span className="tabular text-good">{inr(settled)}</span> settled
                </>
              )}
              {overdue > 0 && <span className="text-bad"> · {overdue} past due</span>}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
