"use client";

import { useState } from "react";
import { useToast } from "./Toasts";
import CategorySelect from "./CategorySelect";
import { inr } from "@/lib/format";

export interface TxnRowData {
  id?: string;
  txn_date?: string;
  date?: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  is_fee?: number;
  isFee?: boolean;
}

export default function TxnTable({
  txns,
  editable = false,
  onChanged,
  onCategoryChange,
}: {
  txns: TxnRowData[];
  editable?: boolean;
  onChanged?: () => void;
  onCategoryChange?: (index: number, category: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const toast = useToast();

  async function setCategory(t: TxnRowData, index: number, category: string) {
    if (onCategoryChange) {
      onCategoryChange(index, category);
      return;
    }
    if (!t.id) return;
    setBusy(t.id);
    setError("");
    const res = await fetch(`/api/transactions/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    setBusy(null);
    if (!res.ok) {
      setError("Could not change that category.");
      toast.push("Could not change that category", { tone: "bad" });
      return;
    }
    toast.push(`Category set to ${category}`, { detail: t.description, tone: "good" });
    onChanged?.();
  }

  const canEdit = editable && (Boolean(onCategoryChange) || txns.some((t) => t.id));

  return (
    <div>
      {error && <p className="mb-2 text-xs text-bad">{error}</p>}
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Description</th>
              <th className="hidden py-2 pr-4 font-medium sm:table-cell">Category</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t, i) => {
              const fee = t.is_fee === 1 || t.isFee;
              const credit = t.type === "credit";
              return (
                <tr
                  key={t.id ?? i}
                  className="rise row-hover border-b border-line/50 last:border-0 hover:bg-surface2/60"
                  style={{ "--d": `${Math.min(i, 15) * 30}ms` } as React.CSSProperties}
                >
                  <td className="whitespace-nowrap py-2 pr-4 text-ink2 tabular">{t.txn_date ?? t.date}</td>
                  <td className="max-w-[11rem] truncate py-2 pr-4 sm:max-w-[26rem]" title={t.description}>
                    {t.description}
                    {fee && (
                      <span className="ml-2 rounded bg-warn/15 px-1.5 py-0.5 text-[11px] font-medium text-warn">FEE</span>
                    )}
                  </td>
                  <td className="hidden whitespace-nowrap py-2 pr-4 text-ink2 sm:table-cell">
                    {canEdit ? (
                      <CategorySelect
                        value={t.category ?? "Other"}
                        credit={credit}
                        disabled={busy === t.id}
                        onChange={(next) => setCategory(t, i, next)}
                        label={`Category for ${t.description}`}
                      />
                    ) : (
                      (t.category ?? "n/a")
                    )}
                  </td>
                  <td className={`whitespace-nowrap py-2 text-right tabular ${credit ? "text-good" : ""}`}>
                    {credit ? "+" : ""}
                    {inr(t.amount, 2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
