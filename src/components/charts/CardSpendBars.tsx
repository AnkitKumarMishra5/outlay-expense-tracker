"use client";

import { useState } from "react";
import BankBadge from "@/components/BankBadge";
import { inr } from "@/lib/format";
import { useChartTokens } from "@/lib/chartTokens";

interface Row {
  card_id: string;
  card_label: string;
  bank_id: string;
  last4: string | null;
  debits: number;
  txns: number;
}

export default function CardSpendBars({ data, colorIndex }: { data: Row[]; colorIndex: Record<string, number> }) {
  const t = useChartTokens();
  const [all, setAll] = useState(false);
  const max = Math.max(...data.map((d) => Number(d.debits)), 1);
  const total = data.reduce((a, d) => a + Number(d.debits), 0) || 1;
  if (data.length === 0) return <p className="py-10 text-center text-sm text-muted">No spend in this period.</p>;
  // A wallet of nineteen turns this into a page of its own. The cards that
  // matter are at the top; the tail is one click away.
  const TOP = 8;
  const shown = all ? data : data.slice(0, TOP);
  const hidden = data.length - shown.length;
  const tail = data.slice(TOP);
  const tailTotal = tail.reduce((a, d) => a + Number(d.debits), 0);
  return (
    <>
    <ul className="space-y-4">
      {shown.map((d, i) => (
        <li key={d.card_id}>
          <div className="mb-1.5 flex items-center gap-2 text-sm">
            <BankBadge bankId={d.bank_id} size={22} />
            <span className="truncate">{d.card_label}</span>
            {d.last4 && <span className="text-xs text-muted tabular">•••• {d.last4}</span>}
            <span className="ml-auto font-medium tabular">{inr(Number(d.debits))}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface2">
            <div
              className="growx h-full rounded-full"
              style={{
                width: `${(Number(d.debits) / max) * 100}%`,
                background: t.series[(colorIndex[d.card_id] ?? 0) % t.series.length],
                "--d": `${200 + i * 120}ms`,
              } as React.CSSProperties}
            />
          </div>
          <p className="mt-1.5 flex flex-wrap gap-x-2 text-[10.5px] text-muted">
            <span className="tabular">{Math.round((Number(d.debits) / total) * 100)}% of spend</span>
            <span aria-hidden>·</span>
            <span className="tabular">
              {d.txns} {d.txns === 1 ? "charge" : "charges"}
            </span>
            {d.txns > 0 && (
              <>
                <span aria-hidden>·</span>
                <span className="tabular">{inr(Math.round(Number(d.debits) / d.txns))} average</span>
              </>
            )}
          </p>
        </li>
      ))}
    </ul>
    {hidden > 0 && (
      <button
        onClick={() => setAll(true)}
        className="mt-4 w-full rounded-lg border border-line px-3 py-2 text-xs text-ink2 transition-colors hover:border-muted hover:text-ink"
      >
        Show {hidden} more {hidden === 1 ? "card" : "cards"}
        <span className="text-muted"> · {inr(tailTotal)} between them</span>
      </button>
    )}
    {all && data.length > TOP && (
      <button
        onClick={() => setAll(false)}
        className="mt-4 w-full rounded-lg border border-line px-3 py-2 text-xs text-ink2 transition-colors hover:border-muted hover:text-ink"
      >
        Show top {TOP} only
      </button>
    )}
    </>
  );
}
