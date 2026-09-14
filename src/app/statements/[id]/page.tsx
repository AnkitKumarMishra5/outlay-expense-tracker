"use client";

import ConfirmDialog from "@/components/ConfirmDialog";

import Link from "next/link";
import { play } from "@/lib/sound";
import PaidToggle from "@/components/PaidToggle";
import { useCallback, useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import BankBadge from "@/components/BankBadge";
import CheckList from "@/components/CheckList";
import CheckSummary from "@/components/CheckSummary";
import SavedTxnTable, { SavedTxn } from "@/components/SavedTxnTable";
import { inr } from "@/lib/format";
import { Check, StatementRow } from "@/lib/types";
import CountUp from "@/components/CountUp";
import { useToast } from "@/components/Toasts";
import type { AiState } from "@/lib/aiQuota";

interface Detail {
  statement: StatementRow & { card_label: string; bank_id: string; bank_name: string; last4: string | null };
  transactions: SavedTxn[];
  ai: AiState;
}

export default function StatementDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  /** The row someone arrived here to see, lit for a moment. */
  const [spot, setSpot] = useState<string | null>(null);
  const spotted = useRef(false);
  const spotTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [missing, setMissing] = useState(false);
  const toast = useToast();

  const load = useCallback(() => {
    fetch(`/api/statements/${id}`).then(async (r) => {
      if (!r.ok) return setMissing(true);
      setData(await r.json());
    });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Arriving from the transactions page with ?txn=, bring that row into view
  // once the table has drawn, light it for three seconds, then tidy the URL so
  // a reload does not do it again.
  useEffect(() => {
    if (!data || spotted.current) return;
    spotted.current = true;
    const want = new URLSearchParams(window.location.search).get("txn");
    if (!want || !data.transactions.some((t) => t.id === want)) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Held in a ref, not returned as cleanup: the page refetches after it loads,
    // and a cleanup on that refetch would cancel the fade before it ran.
    spotTimers.current.push(
      setTimeout(() => {
        document.getElementById(`txn-${want}`)?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
        setSpot(want);
      }, 350),
      setTimeout(() => {
        setSpot(null);
        window.history.replaceState(null, "", window.location.pathname);
      }, 3350)
    );
  }, [data]);

  useEffect(
    () => () => {
      spotTimers.current.forEach(clearTimeout);
      spotTimers.current = [];
      spotted.current = false;
    },
    []
  );

  const [confirming, setConfirming] = useState(false);

  async function remove(): Promise<string | void> {
    const res = await fetch(`/api/statements/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return "That statement could not be deleted. Reload and try again.";
    play("delete");
    toast.push("Statement deleted", { tone: "warn" });
    router.push("/statements");
  }

  if (missing) return <p className="py-20 text-center text-sm text-muted">Statement not found.</p>;
  if (!data)
    return (
      <div className="space-y-5" aria-busy="true" aria-label="Loading statement">
        <div className="shimmer h-12 w-72" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-20" />
          ))}
        </div>
        <div className="shimmer h-64" />
      </div>
    );

  const s = data.statement;
  const checks: Check[] = JSON.parse(s.checks_json || "[]");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <BankBadge bankId={s.bank_id} size={40} />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {s.card_label} {s.last4 && <span className="text-sm font-normal text-muted tabular">•••• {s.last4}</span>}
          </h1>
          <p className="text-sm text-muted">
            {s.period_start ? `${s.period_start} → ${s.period_end}` : s.filename} · parsed with the heuristic parser
          </p>
        </div>
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <PaidToggle
            statementId={id}
            paidAt={data.statement.paid_at}
            dueDate={data.statement.due_date}
            totalDue={data.statement.total_due}
            onChanged={load}
            card={{ bankId: data.statement.bank_id, label: data.statement.card_label, last4: data.statement.last4 }}
          />
        </span>
        <button
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink2 hover:border-bad hover:text-bad"
        >
          Delete
        </button>
        {confirming && (
          <ConfirmDialog
            title="Delete this statement?"
            confirmLabel="Delete statement"
            busyLabel="Deleting…"
            onConfirm={remove}
            onCancel={() => setConfirming(false)}
          >
            <p>
              {data.statement.card_label}
              {data.statement.last4 && <span className="tabular"> •••• {data.statement.last4}</span>} ·{" "}
              {data.transactions.length} transaction{data.transactions.length === 1 ? "" : "s"}
            </p>
            <p className="mt-2 text-xs text-warn">
              Its transactions are deleted too. The PDF on your computer is untouched, so you can upload it again.
            </p>
          </ConfirmDialog>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([
          { k: "Spends", n: Number(s.total_debits), text: null },
          { k: "Credits", n: Number(s.total_credits), text: null },
          {
            k: s.total_due != null && Number(s.total_due) < 0 ? "In credit" : "Total due",
            n: s.total_due != null ? Math.abs(Number(s.total_due)) : null,
            text: null,
          },
          { k: "Due date", n: null, text: s.due_date ?? "n/a" },
        ] as { k: string; n: number | null; text: string | null }[]).map((tile, i) => (
          <div key={tile.k} className="card rise p-4" style={{ "--d": `${i * 60}ms` } as React.CSSProperties}>
            <p className="text-xs text-muted">{tile.k}</p>
            <p className="mt-1 text-lg font-semibold tabular">
              {tile.text ? tile.text : tile.n === null ? "n/a" : <CountUp value={tile.n} format={(v) => inr(v, 2)} />}
            </p>
          </div>
        ))}
      </div>

      <div className="card rise p-5" style={{ "--d": "220ms" } as React.CSSProperties}>
        <h2 className="mb-4 text-sm font-medium text-ink2">Verification checks</h2>
        <div className="mb-4 border-b border-line pb-4">
          <CheckSummary checks={checks} />
        </div>
        <CheckList checks={checks} />
      </div>

      <div className="card rise p-5" style={{ "--d": "300ms" } as React.CSSProperties}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-ink2">Transactions ({data.transactions.length})</h2>
          <Link href="/transactions" className="text-xs text-accent hover:underline">
            Recategorise with AI
          </Link>
        </div>
        <SavedTxnTable txns={data.transactions} onChanged={load} spot={spot} />
      </div>
    </div>
  );
}
