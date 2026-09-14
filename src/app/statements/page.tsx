"use client";

import PaidToggle from "@/components/PaidToggle";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BankBadge from "@/components/BankBadge";
import { inr, monthTitle } from "@/lib/format";
import MonthPicker from "@/components/MonthPicker";
import { Check } from "@/lib/types";
import { useReveal } from "@/lib/useReveal";
import { getJson } from "@/lib/api";
import { play } from "@/lib/sound";

interface Row {
  id: string;
  card_label: string;
  bank_id: string;
  last4: string | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  total_due: number | null;
  statement_date: string | null;
  paid_at: string | null;
  total_debits: number;
  total_credits: number;
  txn_count: number;
  checks_json: string;
  created_at: string;
}

/** A statement belongs to the month it was generated in. */
const dateOf = (s: Row) => s.statement_date ?? s.period_end ?? s.due_date ?? s.created_at.slice(0, 10);
const monthOf = (s: Row) => dateOf(s).slice(0, 7);

export default function Statements() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  /** The month picked, null for all of them, undefined until someone picks. */
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const months = [...new Set((rows ?? []).map(monthOf))].sort().reverse();
  // Opens on the latest statement month, and falls back to it if the month on
  // screen empties out, say after its last statement is deleted.
  const month = picked === undefined || (picked !== null && !months.includes(picked)) ? months[0] ?? null : picked;
  const listRef = useReveal<HTMLDivElement>([rows, month]);
  const router = useRouter();
  const load = useCallback(() => {
    getJson<{ statements: Row[] }>("/api/statements", () => router.replace("/login?expired=1")).then(
      (d) => d && setRows(d.statements ?? [])
    );
  }, [router]);
  useEffect(() => {
    load();
  }, [load]);

  // Deleting takes the statement's transactions with it, so it asks first and
  // says exactly what is going.
  async function remove(s: Row) {
    const what = `${s.card_label} · ${s.txn_count} transaction${s.txn_count === 1 ? "" : "s"}`;
    if (!window.confirm(`Delete this statement?\n\n${what}\n\nIts transactions are deleted too. This cannot be undone.`))
      return;
    setRemoving(s.id);
    const res = await fetch(`/api/statements/${s.id}`, { method: "DELETE" }).catch(() => null);
    setRemoving(null);
    if (res?.ok) {
      play("delete");
      setRows((prev) => prev?.filter((r) => r.id !== s.id) ?? prev);
    } else {
      window.alert("That statement could not be deleted. Reload and try again.");
    }
  }

  if (!rows)
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading statements">
        <div className="shimmer mb-5 h-9 w-40" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="shimmer h-[72px]" />
        ))}
      </div>
    );

  const shown = rows
    .filter((s) => !month || monthOf(s) === month)
    .sort((x, y) => dateOf(y).localeCompare(dateOf(x)) || x.card_label.localeCompare(y.card_label));
  const groups: { month: string; items: Row[]; due: number }[] = [];
  for (const s of shown) {
    const last = groups[groups.length - 1];
    const due = Number(s.total_due ?? s.total_debits);
    if (last?.month === monthOf(s)) {
      last.items.push(s);
      last.due += due;
    } else {
      groups.push({ month: monthOf(s), items: [s], due });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Statements</h1>
        {months.length > 0 && <MonthPicker value={month} months={months} onChange={setPicked} />}
        <Link href="/upload" className="ml-auto rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">
          Upload
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="card p-14 text-center text-sm text-ink2">No statements saved yet.</div>
      ) : (
        <div ref={listRef} className="space-y-6">
          {groups.map((group) => (
            <section key={group.month} aria-label={`${monthTitle(group.month)} statements`}>
              <div className="mb-2 flex flex-wrap items-baseline gap-x-2 px-1">
                <h2 className="text-sm font-medium text-ink">{monthTitle(group.month)}</h2>
                <span className="text-xs text-muted">
                  {group.items.length} statement{group.items.length === 1 ? "" : "s"} ·{" "}
                  <span className="tabular">{inr(group.due)}</span> due
                </span>
              </div>
              <ul className="space-y-2">
                {group.items.map((s, i) => {
                  const checks: Check[] = JSON.parse(s.checks_json || "[]");
                  const warns = checks.filter((c) => c.status === "warn").length;
                  const fails = checks.filter((c) => c.status === "fail").length;
                  const issues = checks.filter((c) => c.status !== "pass");
                  const checkHint = issues.length
                    ? issues.map((c) => `${c.status === "fail" ? "Failed" : "Warning"}: ${c.label}`).join("\n")
                    : `All ${checks.length} checks passed`;
                  const due = Number(s.total_due ?? s.total_debits);
                  return (
                    <li key={s.id} data-reveal style={{ "--d": `${Math.min(i, 8) * 55}ms` } as React.CSSProperties}>
                      <Link href={`/statements/${s.id}`} className="card card-hover flex flex-wrap items-center gap-3 p-4">
                        <BankBadge bankId={s.bank_id} size={34} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {s.card_label} {s.last4 && <span className="text-xs text-muted tabular">•••• {s.last4}</span>}
                          </p>
                          <p className="text-xs text-muted">
                            {s.period_start
                              ? `${s.period_start} → ${s.period_end}`
                              : s.statement_date
                                ? `statement ${s.statement_date}`
                                : `uploaded ${s.created_at.slice(0, 10)}`}{" "}
                            · {s.txn_count} transactions
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
                          {/* How the reading checked out, as a symbol. Kept out of
                              green so it never reads as the bill being paid. */}
                          <span role="img" aria-label={checkHint} data-hint={checkHint} className="hint inline-flex items-center gap-2.5 text-xs">
                            {issues.length === 0 ? (
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden className="text-muted">
                                <path d="M12 3.2 19 6v5.2c0 4.4-2.9 8.1-7 9.6-4.1-1.5-7-5.2-7-9.6V6l7-2.8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                                <path d="m8.8 12.1 2.2 2.2 4.3-4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <>
                                {fails > 0 && (
                                  <span className="inline-flex items-center gap-1 font-medium text-bad tabular">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                                      <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.8" />
                                      <path d="m9.2 9.2 5.6 5.6m0-5.6-5.6 5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                    {fails}
                                  </span>
                                )}
                                {warns > 0 && (
                                  <span className="inline-flex items-center gap-1 font-medium text-warn tabular">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                                      <path d="M12 4.2 2.9 19.5h18.2L12 4.2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                      <path d="M12 10v4.2m0 2.6h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                                    </svg>
                                    {warns}
                                  </span>
                                )}
                              </>
                            )}
                          </span>
                          {/* What the bill came to, the way the statement leads
                              with it; spend only when no total was printed. */}
                          <span className="flex min-w-[5.5rem] flex-col items-end gap-1">
                            <span className="font-medium tabular">{inr(Math.abs(due))}</span>
                            {s.paid_at ? (
                              <span className="settled-seal" title={`Settled on ${s.paid_at.slice(0, 10)}`}>
                                Settled
                              </span>
                            ) : due < 0 ? (
                              <span className="text-[10px] uppercase tracking-wider text-good">in credit</span>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider text-muted">
                                {s.total_due != null ? "due" : "spends"}
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            aria-label={`Delete the ${s.card_label} statement`}
                            title="Delete this statement"
                            disabled={removing === s.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              remove(s);
                            }}
                            className="rounded-lg border border-line p-1.5 text-muted transition-colors hover:border-bad/50 hover:text-bad disabled:opacity-40"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path
                                d="M4 7h16M10 4h4M9 7v12m6-12v12M6 7l1 13h10l1-13"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
