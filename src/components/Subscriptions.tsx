"use client";

import { useState } from "react";
import { inr } from "@/lib/format";
import { bankById } from "@/lib/banks";
import type { Subscription } from "@/lib/subscriptions";

export default function Subscriptions({ subs }: { subs: Subscription[] }) {
  const [all, setAll] = useState(false);
  if (subs.length === 0) return null;

  const monthly = subs.reduce((a, s) => a + s.perYear / 12, 0);
  const shown = all ? subs : subs.slice(0, 5);

  return (
    <div className="card rise min-w-0 p-5" style={{ "--d": "300ms" } as React.CSSProperties}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-sm font-medium text-ink2">Recurring</h2>
        <p className="text-sm">
          <span className="font-semibold tabular">{subs.length}</span>
          <span className="text-ink2"> found</span>
          <span className="text-muted"> · </span>
          <span className="tabular text-ink2">{inr(monthly)}</span>
          <span className="text-muted"> a month, {inr(monthly * 12)} a year</span>
        </p>
        {subs.length > 5 && (
          <button
            onClick={() => setAll((v) => !v)}
            className="ml-auto rounded-md border border-line px-2 py-1 text-[11px] text-ink2 transition-colors hover:border-muted hover:text-ink"
          >
            {all ? "Show top 5" : `Show all ${subs.length}`}
          </button>
        )}
      </div>

      <ul className="mt-3 space-y-1.5">
        {shown.map((s, i) => (
          <li
            key={s.key}
            className="rise flex items-center gap-2.5 rounded-lg border border-line bg-surface2 px-2.5 py-2 text-xs"
            style={{ "--d": `${Math.min(i, 8) * 40}ms` } as React.CSSProperties}
          >
            <span className="h-6 w-1 shrink-0 rounded-full" style={{ background: bankById(s.bankId).color }} />
            <span className="min-w-0 flex-1 truncate">
              <span className="text-ink">{s.merchant}</span>{" "}
              <span className="text-muted">
                {s.cardLabel} •••• {s.last4 ?? "????"}
              </span>
            </span>
            <span className="hidden whitespace-nowrap text-muted sm:inline">
              {s.charges} charges, {s.cadence}
            </span>
            <span className="whitespace-nowrap tabular text-ink">{inr(s.amount)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[11px] text-muted">
        Same merchant, same amount, same card, on a steady cycle. Three or more charges before anything is called
        recurring.
      </p>
    </div>
  );
}
