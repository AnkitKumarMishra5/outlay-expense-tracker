"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import BankBadge from "./BankBadge";
import { inr } from "@/lib/format";
import { CardRow } from "@/lib/types";

interface Scope {
  statements: number;
  transactions: number;
  spend: number;
}

export default function ConfirmDelete({
  card,
  onCancel,
  onDeleted,
}: {
  card: CardRow;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [scope, setScope] = useState<Scope | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/statements")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const mine = (d?.statements ?? []).filter((s: { card_id: string }) => s.card_id === card.id);
        setScope({
          statements: mine.length,
          transactions: mine.reduce((a: number, s: { txn_count: number }) => a + Number(s.txn_count ?? 0), 0),
          spend: mine.reduce((a: number, s: { total_debits: number }) => a + Number(s.total_debits ?? 0), 0),
        });
      })
      .catch(() => setScope({ statements: 0, transactions: 0, spend: 0 }));
  }, [card.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function remove() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("Could not remove that card.");
      return;
    }
    onDeleted();
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-label="Remove card">
      <div className="modal-panel">
        <div className="flex items-center gap-3">
          <BankBadge bankId={card.bank_id} size={34} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{card.card_label}</p>
            <p className="text-xs text-muted">
              {card.bank_name}
              {card.last4 && <span className="tabular"> · •••• {card.last4}</span>}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm text-ink2">Removing this card also deletes everything Outlay holds for it.</p>

        {scope === null ? (
          <div className="shimmer mt-3 h-20 rounded-lg" />
        ) : (
          <ul className="mt-3 space-y-1.5 rounded-lg border border-line bg-surface2 p-3 text-sm">
            <li className="flex justify-between gap-3">
              <span className="text-ink2">Saved statements</span>
              <span className="tabular">{scope.statements}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-ink2">Transactions</span>
              <span className="tabular">{scope.transactions}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-ink2">Spend recorded</span>
              <span className="tabular">{inr(scope.spend)}</span>
            </li>
            <li className="flex justify-between gap-3 border-t border-line pt-1.5">
              <span className="text-ink2">Stored statement password</span>
              <span className="text-muted">{card.has_password ? "deleted" : "none saved"}</span>
            </li>
          </ul>
        )}

        <p className="mt-3 text-xs text-warn">
          This cannot be undone. The statement PDFs on your computer are untouched, so you can upload them again later.
        </p>

        {error && <p className="mt-2 text-xs text-bad">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink2 hover:border-muted hover:text-ink"
          >
            Keep it
          </button>
          <button
            onClick={remove}
            disabled={busy || scope === null}
            className="rounded-lg bg-bad px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Removing…" : "Remove card and its data"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
