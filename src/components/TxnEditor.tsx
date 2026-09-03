"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, FEE_RE, INTL_RE } from "@/lib/categories";
import { inr } from "@/lib/format";
import { ParsedTxn, StatementSummary } from "@/lib/types";

const field =
  "w-full rounded-md border border-line bg-surface px-2 py-1 text-xs outline-none focus:border-accent";

function blank(): ParsedTxn {
  return {
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: 0,
    type: "debit",
    category: "Other",
    isFee: false,
    isInternational: false,
  };
}

export default function TxnEditor({
  txns,
  summary,
  onChange,
  onClose,
}: {
  txns: ParsedTxn[];
  summary: StatementSummary;
  onChange: (next: ParsedTxn[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ParsedTxn[]>(txns);

  const totals = useMemo(() => {
    const round = (n: number) => Math.round(n * 100) / 100;
    const debits = round(draft.filter((t) => t.type === "debit").reduce((a, t) => a + t.amount, 0));
    const credits = round(draft.filter((t) => t.type === "credit").reduce((a, t) => a + t.amount, 0));
    return { debits, credits };
  }, [draft]);

  const debitDelta = summary.statedDebits != null ? totals.debits - summary.statedDebits : null;
  const creditDelta = summary.statedCredits != null ? totals.credits - summary.statedCredits : null;

  function patch(i: number, next: Partial<ParsedTxn>) {
    setDraft((prev) =>
      prev.map((t, k) => {
        if (k !== i) return t;
        const merged = { ...t, ...next };
        if (next.description !== undefined) {
          merged.isFee = FEE_RE.test(merged.description);
          merged.isInternational = INTL_RE.test(merged.description);
        }
        return merged;
      })
    );
  }

  const invalid = draft.some((t) => !t.description.trim() || !(t.amount > 0));

  return (
    <div className="mt-3 rounded-lg border border-line bg-surface p-3">
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span className="font-medium text-ink">Correct the extraction</span>
        <span className="text-muted">
          Debits <span className="tabular text-ink2">{inr(totals.debits)}</span>
          {debitDelta !== null && (
            <span className={Math.abs(debitDelta) < 1 ? "text-good" : "text-bad"}>
              {Math.abs(debitDelta) < 1 ? " matches printed" : ` off by ${inr(Math.abs(debitDelta))}`}
            </span>
          )}
        </span>
        <span className="text-muted">
          Credits <span className="tabular text-ink2">{inr(totals.credits)}</span>
          {creditDelta !== null && (
            <span className={Math.abs(creditDelta) < 1 ? "text-good" : "text-bad"}>
              {Math.abs(creditDelta) < 1 ? " matches printed" : ` off by ${inr(Math.abs(creditDelta))}`}
            </span>
          )}
        </span>
        <span className="ml-auto text-muted">{draft.length} rows</span>
      </div>

      <div className="max-h-[320px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-muted">
              <th className="pb-1 pr-2 font-medium">Date</th>
              <th className="pb-1 pr-2 font-medium">Description</th>
              <th className="pb-1 pr-2 font-medium">Category</th>
              <th className="pb-1 pr-2 text-right font-medium">Amount</th>
              <th className="pb-1 pr-2 font-medium">Type</th>
              <th className="pb-1" />
            </tr>
          </thead>
          <tbody>
            {draft.map((t, i) => (
              <tr key={i} className="align-top">
                <td className="py-1 pr-2">
                  <input type="date" value={t.date} onChange={(e) => patch(i, { date: e.target.value })} className={`${field} w-[130px]`} />
                </td>
                <td className="py-1 pr-2">
                  <input value={t.description} onChange={(e) => patch(i, { description: e.target.value })} className={field} />
                </td>
                <td className="py-1 pr-2">
                  <select value={t.category ?? "Other"} onChange={(e) => patch(i, { category: e.target.value })} className={`${field} w-[130px]`}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={t.amount}
                    onChange={(e) => patch(i, { amount: Number(e.target.value) })}
                    className={`${field} w-[100px] text-right tabular`}
                  />
                </td>
                <td className="py-1 pr-2">
                  <select value={t.type} onChange={(e) => patch(i, { type: e.target.value as ParsedTxn["type"] })} className={`${field} w-[84px]`}>
                    <option value="debit">debit</option>
                    <option value="credit">credit</option>
                  </select>
                </td>
                <td className="py-1">
                  <button
                    onClick={() => setDraft((prev) => prev.filter((_, k) => k !== i))}
                    aria-label={`Remove ${t.description || "transaction"}`}
                    className="rounded-md border border-line px-1.5 py-1 text-[11px] text-muted hover:border-bad hover:text-bad"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setDraft((prev) => [...prev, blank()])}
          className="rounded-md border border-line px-2.5 py-1 text-[11px] text-ink2 hover:border-muted hover:text-ink"
        >
          Add a transaction
        </button>
        <span className="ml-auto flex gap-2">
          <button onClick={onClose} className="rounded-md border border-line px-2.5 py-1 text-[11px] text-ink2 hover:border-muted">
            Cancel
          </button>
          <button
            disabled={invalid}
            onClick={() => {
              onChange(draft);
              onClose();
            }}
            className="rounded-md bg-accent px-3 py-1 text-[11px] font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            Apply
          </button>
        </span>
      </div>
      {invalid && <p className="mt-1 text-[10px] text-bad">Every row needs a description and an amount above zero.</p>}
    </div>
  );
}
