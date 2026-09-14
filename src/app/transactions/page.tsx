"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BankBadge from "@/components/BankBadge";
import { useToast } from "@/components/Toasts";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import CategorySelect from "@/components/CategorySelect";
import AiSweep from "@/components/AiSweep";
import { inr } from "@/lib/format";
import MonthPicker from "@/components/MonthPicker";
import { CardRow } from "@/lib/types";
import { getJson } from "@/lib/api";

interface Row {
  id: string;
  txn_date: string;
  txn_time: string | null;
  description: string;
  amount: number;
  type: string;
  category: string;
  is_fee: number;
  is_international: number;
  statement_id: string;
  card_id: string;
  card_label: string;
  bank_id: string;
  bank_name: string;
  last4: string | null;
}

interface StatementRow {
  id: string;
  card_id: string;
  card_label: string;
  last4: string | null;
  period_start: string | null;
  period_end: string | null;
  statement_date: string | null;
  due_date: string | null;
  txn_count: number;
}

const field =
  "h-9 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-sm text-ink2 outline-none transition-colors hover:border-muted focus:border-accent";

function periodLabel(s: StatementRow) {
  if (s.period_start && s.period_end) return `${s.period_start} to ${s.period_end}`;
  return s.statement_date ?? "undated";
}

export default function TransactionsPage() {
  const router = useRouter();
  const onExpired = useCallback(() => router.replace("/login?expired=1"), [router]);

  const [cards, setCards] = useState<CardRow[]>([]);
  const [statements, setStatements] = useState<StatementRow[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState({ total: 0, debits: 0, credits: 0, payments: 0 });
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const toast = useToast();

  const [cardId, setCardId] = useState("");
  const [statementId, setStatementId] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  /** Statement month. undefined until the list of months is known, null for all of them. */
  const [month, setMonth] = useState<string | null | undefined>(undefined);
  const [months, setMonths] = useState<string[]>([]);
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(q.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    getJson<{ cards: CardRow[] }>("/api/cards", onExpired).then((d) => d && setCards(d.cards ?? []));
    getJson<{ statements: StatementRow[] }>("/api/statements", onExpired).then(
      (d) => d && setStatements(d.statements ?? [])
    );
    // A month means the statement month everywhere, and the page opens on the
    // latest one rather than on the whole history.
    getJson<{ months: string[] }>("/api/transactions?limit=1", onExpired).then((d) => {
      const list = d?.months ?? [];
      setMonths(list);
      setMonth(list[0] ?? null);
    });
  }, [onExpired]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (cardId) p.set("cardId", cardId);
    if (statementId) p.set("statementId", statementId);
    if (category) p.set("category", category);
    if (type) p.set("type", type);
    if (search) p.set("q", search);
    if (offset) p.set("offset", String(offset));
    if (month) p.set("month", month);
    if (order === "asc") p.set("sort", "asc");
    return p.toString();
  }, [cardId, statementId, category, type, search, offset, month, order]);

  const load = useCallback(() => {
    if (month === undefined) return;
    getJson<{
      transactions: Row[];
      more: boolean;
      offset: number;
      total: number;
      debits: number;
      credits: number;
      payments: number;
    }>(`/api/transactions?${query}`, onExpired).then((d) => {
      setLoading(false);
      if (!d) return;
      setRows((prev) => (d.offset > 0 ? [...prev, ...d.transactions] : d.transactions));
      setMore(d.more);
      setSummary({ total: d.total, debits: d.debits, credits: d.credits, payments: d.payments ?? 0 });
    });
  }, [query, onExpired, month]);

  useEffect(load, [load]);

  const visibleStatements = statements.filter(
    (s) =>
      (!cardId || s.card_id === cardId) &&
      (!month || (s.statement_date ?? s.period_end ?? s.due_date ?? "").slice(0, 7) === month)
  );
  const latest = months[0] ?? null;

  async function setRowCategory(row: Row, next: string) {
    setBusy(row.id);
    setError("");
    const res = await fetch(`/api/transactions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: next }),
    });
    setBusy(null);
    if (!res.ok) {
      setError("Could not change that category.");
      toast.push("Could not change that category", { tone: "bad" });
      return;
    }
    toast.push(`Category set to ${next}`, { detail: row.description, tone: "good" });
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, category: next } : r)));
  }

  const filtered = Boolean(cardId || statementId || category || type || search) || (month !== undefined && month !== latest);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-ink2">
          <span className="tabular">{summary.total}</span> row{summary.total === 1 ? "" : "s"}
          {type !== "credit" && (
            <>
              <span className="text-muted"> · </span>
              <span className="tabular">{inr(summary.debits)}</span> spends
            </>
          )}
          {summary.credits > 0 && (
            <>
              <span className="text-muted"> · </span>
              <span className="tabular text-good">{inr(summary.credits)}</span> credits
              {/* Both parts live inside credits, so they read as a breakdown of it. */}
              {summary.payments > 0 && summary.credits - summary.payments > 1 && (
                <span className="text-muted">
                  {" ("}
                  <span className="tabular text-ink2">{inr(summary.payments)}</span> payments +{" "}
                  <span className="tabular text-ink2">{inr(summary.credits - summary.payments)}</span> refunds &amp; cashbacks)
                </span>
              )}
              {summary.payments > 0 && summary.credits - summary.payments <= 1 && (
                <span className="text-muted"> (all payments)</span>
              )}
              {summary.payments === 0 && <span className="text-muted"> (all refunds &amp; cashbacks)</span>}
            </>
          )}
        </p>
        <span className="ml-auto flex flex-wrap items-center gap-3">
          <AiSweep onApplied={load} />
          <Link href="/statements" className="text-xs text-accent hover:underline">
            Statements
          </Link>
        </span>
      </div>

      <div className="card space-y-4 p-4 sm:p-5">
        {/* Which statement month, and which side of the ledger. The rest narrows within it. */}
        <div className="flex flex-wrap items-center gap-3">
          {month === undefined ? (
            <div className="shimmer h-9 w-[210px] rounded-[10px]" aria-hidden />
          ) : (
            <MonthPicker
              value={month}
              months={months}
              onChange={(m) => { setMonth(m); setStatementId(""); setOffset(0); }}
            />
          )}
          <div className="span-picker is-roomy" role="group" aria-label="Spends or credits">
            {[
              { v: "", l: "Everything" },
              { v: "debit", l: "Spends" },
              { v: "credit", l: "Credits" },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => { setType(o.v); setOffset(0); }}
                aria-pressed={type === o.v}
                className={type === o.v ? "is-on" : ""}
              >
                {o.l}
              </button>
            ))}
          </div>
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setCardId("");
                setStatementId("");
                setCategory("");
                setType("");
                setQ("");
                setMonth(latest);
                setOffset(0);
              }}
              className="ml-auto text-xs text-muted underline underline-offset-2 hover:text-ink"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
          <label className="relative block">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            >
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
              <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search description"
              className={`${field} pl-9`}
              aria-label="Search description"
            />
          </label>
          <select value={cardId} onChange={(e) => { setCardId(e.target.value); setStatementId(""); setOffset(0); }} className={field} aria-label="Card">
            <option value="">All cards</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.card_label} {c.last4 ? `•••• ${c.last4}` : ""}
              </option>
            ))}
          </select>
          <select value={statementId} onChange={(e) => { setStatementId(e.target.value); setOffset(0); }} className={field} aria-label="Statement">
            <option value="">All statements</option>
            {visibleStatements.map((s) => (
              <option key={s.id} value={s.id}>
                {s.card_label} · {periodLabel(s)}
              </option>
            ))}
          </select>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setOffset(0); }} className={field} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-bad">{error}</p>}

      <div className="card min-w-0 p-4">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4 font-medium" aria-sort={order === "desc" ? "descending" : "ascending"}>
                  <button
                    type="button"
                    onClick={() => { setOrder((o) => (o === "desc" ? "asc" : "desc")); setOffset(0); }}
                    title={order === "desc" ? "Newest first. Click for oldest first" : "Oldest first. Click for newest first"}
                    className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-ink"
                  >
                    Date
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden className={order === "asc" ? "rotate-180" : ""}>
                      <path d="M12 5v14m0 0-6-6m6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </th>
                <th className="py-2 pr-4 font-medium">Description</th>
                <th className="hidden py-2 pr-4 font-medium md:table-cell">Card</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("select, button, a, input")) return;
                    router.push(`/statements/${r.statement_id}?txn=${r.id}`);
                  }}
                  title="Open it on its statement"
                  // A firmer rule where the date changes, so a day's charges read as one group.
                  className={`rise row-hover cursor-pointer border-b last:border-0 hover:bg-surface2/60 ${
                    rows[i + 1] && rows[i + 1].txn_date !== r.txn_date ? "border-muted/45" : "border-line/30"
                  }`}
                  style={{ "--d": `${Math.min(i, 20) * 20}ms` } as React.CSSProperties}
                >
                  <td className="whitespace-nowrap py-2 pr-4 text-ink2 tabular">
                    {r.txn_date}
                    {r.txn_time && <span className="block text-[11px] leading-tight text-muted">{r.txn_time}</span>}
                  </td>
                  <td className="max-w-[12rem] truncate py-2 pr-4 sm:max-w-[24rem]" title={r.description}>
                    <Link href={`/statements/${r.statement_id}?txn=${r.id}`} className="hover:underline">
                      {r.description}
                    </Link>
                    {r.is_fee === 1 && (
                      <span className="ml-2 rounded bg-warn/15 px-1.5 py-0.5 text-[10px] uppercase text-warn">fee</span>
                    )}
                    {r.is_international === 1 && (
                      <span className="ml-2 rounded bg-surface2 px-1.5 py-0.5 text-[10px] uppercase text-muted">intl</span>
                    )}
                  </td>
                  <td className="hidden whitespace-nowrap py-2 pr-4 text-xs md:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <BankBadge bankId={r.bank_id} size={20} />
                      {r.card_label}
                      <span className="text-muted">•••• {r.last4 ?? "????"}</span>
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <CategorySelect
                      value={r.category}
                      credit={r.type === "credit"}
                      disabled={busy === r.id}
                      onChange={(next) => setRowCategory(r, next)}
                      label={`Category for ${r.description}`}
                    />
                  </td>
                  <td className={`whitespace-nowrap py-2 text-right tabular ${r.type === "credit" ? "text-good" : ""}`}>
                    {r.type === "credit" ? "+" : ""}
                    {inr(r.amount, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && !loading && (
          <p className="py-10 text-center text-sm text-muted">
            {filtered ? "No transactions match these filters." : "No transactions yet. Upload a statement to get started."}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted">
            Showing {rows.length} of {summary.total}. Change a category from the dropdown, it saves immediately and the
            statement checks are recalculated.
          </p>
          {more && (
            <button
              onClick={() => { setLoading(true); setOffset(rows.length); }}
              disabled={loading}
              className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs text-ink2 transition-colors hover:border-muted hover:text-ink disabled:opacity-40"
            >
              {loading ? "Loading" : "Load more"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
