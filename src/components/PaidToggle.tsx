"use client";

import { useState } from "react";
import { useToast } from "./Toasts";

function daysUntil(day: string): number {
  const target = new Date(`${day}T00:00:00`).getTime();
  const now = new Date().getTime();
  return Math.round((target - now) / 86_400_000);
}

export default function PaidToggle({
  statementId,
  paidAt,
  dueDate,
  totalDue,
  onChanged,
  compact = false,
}: {
  statementId: string;
  paidAt: string | null;
  dueDate: string | null;
  totalDue?: number | null;
  onChanged: () => void;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const paid = Boolean(paidAt);
  const nothingOwed = totalDue != null && totalDue <= 0;

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/statements/${statementId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: !paid }),
    });
    setBusy(false);
    if (res.ok) {
      toast.push(paid ? "Marked as not settled" : "Marked as settled", {
        tone: paid ? "info" : "good",
      });
      onChanged();
    } else {
      toast.push("Could not update this statement", { tone: "bad" });
    }
  }

  const days = dueDate ? daysUntil(dueDate) : null;
  const overdue = !paid && !nothingOwed && days !== null && days < 0;

  const state = paid
    ? { text: `Settled${paidAt ? ` on ${paidAt.slice(0, 10)}` : ""}`, tone: "text-good border-good/40 bg-good/10" }
    : nothingOwed
      ? { text: "Settled, nothing was owed", tone: "text-good border-good/40 bg-good/10" }
      : overdue
        ? { text: `Overdue by ${Math.abs(days!)} day${Math.abs(days!) === 1 ? "" : "s"}`, tone: "text-bad border-bad/40 bg-bad/10" }
        : days !== null
          ? { text: days === 0 ? "Due today" : `Due in ${days} day${days === 1 ? "" : "s"}`, tone: "text-warn border-warn/40 bg-warn/10" }
          : { text: "Not settled", tone: "text-ink2 border-line" };

  return (
    <span className={compact ? "flex items-center gap-2" : "flex flex-wrap items-center gap-2"}>
      <span className={`rounded-md border px-2 py-0.5 text-[11px] ${state.tone}`}>{state.text}</span>
      {!nothingOwed && (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        disabled={busy}
        className={`rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:opacity-40 ${
          paid ? "border-line text-ink2 hover:border-muted" : "border-good/50 text-good hover:bg-good/10"
        }`}
      >
        {busy ? "Saving…" : paid ? "Mark unsettled" : "Mark as settled"}
      </button>
      )}
    </span>
  );
}
