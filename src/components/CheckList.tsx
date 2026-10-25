"use client";

import { useState } from "react";
import { Check } from "@/lib/types";

function Icon({ status, delay, reviewed }: { status: Check["status"]; delay: string; reviewed?: boolean }) {
  const style = { "--d": delay } as React.CSSProperties;
  if (status === "pass" || reviewed)
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className={`draw-tick mt-0.5 shrink-0 ${reviewed ? "text-muted" : "text-good"}`} style={style}>
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path className="tick" d="M4.8 8.2l2.1 2.1 4.2-4.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
      </svg>
    );
  if (status === "warn")
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="pop mt-0.5 shrink-0 text-warn" style={style}>
        <path d="M8 1.8L15 14H1z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 6v3.4M8 11.6v.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="pop mt-0.5 shrink-0 text-bad" style={style}>
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const STATUS_LABEL = { pass: "Passed", warn: "Warning", fail: "Failed" };

/**
 * @param onReview When given, each warning and failure can be marked as
 *   reviewed, for a finding that was corrected, expected or a false alarm.
 */
export default function CheckList({
  checks,
  onReview,
}: {
  checks: Check[];
  onReview?: (check: Check, reviewed: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <ul className="space-y-3">
      {checks.map((c, i) => (
        <li key={c.id} className="rise flex gap-3" style={{ "--d": `${i * 70}ms` } as React.CSSProperties}>
          <Icon status={c.status} delay={`${i * 70}ms`} reviewed={c.reviewed} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {c.label}
              <span className="sr-only">: {c.reviewed ? `${STATUS_LABEL[c.status]}, reviewed` : STATUS_LABEL[c.status]}</span>
              {c.reviewed && (
                <span className="ml-2 rounded-md border border-line px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wider text-muted">
                  Reviewed
                </span>
              )}
            </p>
            <p className={`mt-0.5 text-sm leading-snug ${c.reviewed ? "text-muted" : "text-ink2"}`}>{c.detail}</p>
            {onReview && c.status !== "pass" && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={async () => {
                  setBusy(c.id);
                  try {
                    await onReview(c, !c.reviewed);
                  } finally {
                    setBusy(null);
                  }
                }}
                className="mt-1.5 rounded-md border border-line px-2 py-0.5 text-xs text-ink2 transition-colors hover:border-muted disabled:opacity-40"
              >
                {busy === c.id ? "Saving…" : c.reviewed ? "Undo review" : "Mark as reviewed"}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
