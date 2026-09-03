"use client";

import BankBadge from "@/components/BankBadge";
import { inr } from "@/lib/format";
import { useChartTokens } from "@/lib/chartTokens";

interface Row {
  card_id: string;
  card_label: string;
  bank_id: string;
  last4: string | null;
  debits: number;
}

export default function CardSpendBars({ data, colorIndex }: { data: Row[]; colorIndex: Record<string, number> }) {
  const t = useChartTokens();
  const max = Math.max(...data.map((d) => Number(d.debits)), 1);
  if (data.length === 0) return <p className="py-10 text-center text-sm text-muted">No spend in this period.</p>;
  return (
    <ul className="space-y-4">
      {data.map((d, i) => (
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
        </li>
      ))}
    </ul>
  );
}
