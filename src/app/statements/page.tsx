"use client";

import PaidToggle from "@/components/PaidToggle";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BankBadge from "@/components/BankBadge";
import { inr } from "@/lib/format";
import { Check } from "@/lib/types";
import { useReveal } from "@/lib/useReveal";
import { getJson } from "@/lib/api";

interface Row {
  id: string;
  card_label: string;
  bank_id: string;
  last4: string | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  total_due: number | null;
  paid_at: string | null;
  total_debits: number;
  total_credits: number;
  txn_count: number;
  checks_json: string;
  created_at: string;
}

export default function Statements() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const listRef = useReveal<HTMLUListElement>([rows]);
  const router = useRouter();
  const load = useCallback(() => {
    getJson<{ statements: Row[] }>("/api/statements", () => router.replace("/login?expired=1")).then(
      (d) => d && setRows(d.statements ?? [])
    );
  }, [router]);
  useEffect(() => {
    load();
  }, [load]);

  if (!rows)
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading statements">
        <div className="shimmer mb-5 h-9 w-40" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="shimmer h-[72px]" />
        ))}
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Statements</h1>
        <Link href="/upload" className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">
          Upload
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="card p-14 text-center text-sm text-ink2">No statements saved yet.</div>
      ) : (
        <ul ref={listRef} className="space-y-2">
          {rows.map((s, i) => {
            const checks: Check[] = JSON.parse(s.checks_json || "[]");
            const warns = checks.filter((c) => c.status === "warn").length;
            const fails = checks.filter((c) => c.status === "fail").length;
            return (
              <li key={s.id} data-reveal style={{ "--d": `${Math.min(i, 8) * 55}ms` } as React.CSSProperties}>
                <Link href={`/statements/${s.id}`} className="card card-hover flex flex-wrap items-center gap-3 p-4">
                  <BankBadge bankId={s.bank_id} size={34} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {s.card_label} {s.last4 && <span className="text-xs text-muted tabular">•••• {s.last4}</span>}
                    </p>
                    <p className="text-xs text-muted">
                      {s.period_start ? `${s.period_start} → ${s.period_end}` : `uploaded ${s.created_at.slice(0, 10)}`} · {s.txn_count} transactions
                    </p>
                    <span className="mt-1.5 inline-flex">
                      <PaidToggle
                        statementId={s.id}
                        paidAt={s.paid_at}
                        dueDate={s.due_date}
                        totalDue={s.total_due}
                        onChanged={load}
                        compact
                        card={{ bankId: s.bank_id, label: s.card_label, last4: s.last4 }}
                      />
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-4 text-sm">
                    <div className="flex gap-2 text-xs">
                      {fails > 0 && <span className="rounded bg-bad/15 px-1.5 py-0.5 font-medium text-bad">{fails} failed</span>}
                      {warns > 0 && <span className="rounded bg-warn/15 px-1.5 py-0.5 font-medium text-warn">{warns} warning{warns === 1 ? "" : "s"}</span>}
                      {fails === 0 && warns === 0 && <span className="rounded bg-good/15 px-1.5 py-0.5 font-medium text-good">all clear</span>}
                    </div>
                    <span className="font-medium tabular">{inr(Number(s.total_debits))}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
