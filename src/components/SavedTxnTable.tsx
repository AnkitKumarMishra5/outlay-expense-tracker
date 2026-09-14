"use client";

import { useState } from "react";
import { useToast } from "./Toasts";
import CategorySelect from "./CategorySelect";
import { inr } from "@/lib/format";

export interface SavedTxn {
  id: string;
  txn_date: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  is_fee: number;
}

const field = "rounded-md border border-line bg-surface px-2 py-1 text-xs outline-none focus:border-accent";

export default function SavedTxnTable({
  txns,
  onChanged,
  flashed,
  spot,
}: {
  txns: SavedTxn[];
  onChanged: () => void;
  flashed?: Set<string>;
  /** A row to light up, when someone arrived here looking for it. */
  spot?: string | null;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const toast = useToast();

  async function send(id: string, body: Record<string, unknown>, note?: string) {
    setBusy(id);
    setError("");
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save that change.");
      toast.push("Could not save that change", { tone: "bad" });
      return;
    }
    setEditing(null);
    if (note) toast.push(note, { detail: "Statement totals and checks recalculated", tone: "good" });
    onChanged();
  }

  async function remove(id: string) {
    setBusy(id);
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      toast.push("Transaction removed", { detail: "Statement totals and checks recalculated", tone: "warn" });
      onChanged();
    } else {
      setError("Could not remove that row.");
      toast.push("Could not remove that row", { tone: "bad" });
    }
  }

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
              <th className="py-2 pr-4 text-right font-medium">Amount</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {txns.map((t, i) => {
              const credit = t.type === "credit";
              const isEditing = editing === t.id;
              return (
                <tr
                  key={t.id}
                  id={`txn-${t.id}`}
                  className={`rise row-hover scroll-mt-24 border-b last:border-0 hover:bg-surface2/60 ${
                    txns[i + 1] && txns[i + 1].txn_date !== t.txn_date ? "border-muted/45" : "border-line/30"
                  } ${spot === t.id ? "txn-spot" : ""}`}
                  style={{ "--d": `${Math.min(i, 15) * 30}ms` } as React.CSSProperties}
                >
                  <td className="whitespace-nowrap py-2 pr-4 text-ink2 tabular">
                    {t.txn_date}
                  </td>
                  <td className="max-w-[11rem] truncate py-2 pr-4 sm:max-w-[26rem]" title={t.description}>
                    {t.description}
                    {t.is_fee === 1 && (
                      <span className="ml-2 rounded bg-warn/15 px-1.5 py-0.5 text-[10px] uppercase text-warn">fee</span>
                    )}
                  </td>
                  <td className="hidden py-2 pr-4 sm:table-cell">
                    <CategorySelect
                      value={t.category}
                      credit={t.type === "credit"}
                      disabled={busy === t.id}
                      onChange={(next) => send(t.id, { category: next }, `Category set to ${next}`)}
                      label={`Category for ${t.description}`}
                      flash={flashed?.has(t.id)}
                    />
                  </td>
                  <td className="whitespace-nowrap py-2 pr-4 text-right">
                    {isEditing ? (
                      <span className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && Number(amount) > 0 && busy !== t.id) {
                              e.preventDefault();
                              send(t.id, { amount: Number(amount) }, `Amount updated to ${inr(Number(amount))}`);
                            }
                            if (e.key === "Escape") setEditing(null);
                          }}
                          className={`${field} w-[104px] text-right tabular`}
                          autoFocus
                        />
                        <button
                          onClick={() => send(t.id, { amount: Number(amount) }, `Amount updated to ${inr(Number(amount))}`)}
                          disabled={busy === t.id || !(Number(amount) > 0)}
                          className="rounded-md bg-accent px-2 py-1 text-[11px] text-white disabled:opacity-40"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditing(null)} className="rounded-md border border-line px-2 py-1 text-[11px] text-ink2">
                          ✕
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setEditing(t.id);
                          setAmount(String(t.amount));
                        }}
                        className={`tabular rounded px-1 hover:underline ${credit ? "text-good" : ""}`}
                        title="Click to correct this amount"
                      >
                        {credit ? "+" : ""}
                        {inr(t.amount)}
                      </button>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => remove(t.id)}
                      disabled={busy === t.id}
                      aria-label={`Remove ${t.description}`}
                      className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-muted hover:border-bad hover:text-bad disabled:opacity-40"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Click an amount to correct it, or change a category. The statement totals and its verification checks are
        recalculated on every edit.
      </p>
    </div>
  );
}
