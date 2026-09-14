"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BankBadge from "./BankBadge";
import CategorySelect from "./CategorySelect";
import AiOverlay, { BotMark, REVIEW_STAGES } from "./AiOverlay";
import { useToast } from "./Toasts";
import { inr, monthTitle } from "@/lib/format";
import { play } from "@/lib/sound";
import type { AiProposal } from "@/lib/aiSweep";

interface AiState {
  configured: boolean;
  used: number;
  limit: number;
  remaining: number;
}

type Decision = { keep: boolean; category: string };

/**
 * Ask the model to sort the charges on one statement month, or on every
 * statement, then show what it wants to change before anything moves.
 * Cancelling discards the lot.
 */
export default function AiSweep({ onApplied }: { onApplied: () => void }) {
  const toast = useToast();
  const [ai, setAi] = useState<AiState | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  /** null means every statement. */
  const [month, setMonth] = useState<string | null>(null);
  const [months, setMonths] = useState<string[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [ran, setRan] = useState<string | null>(null);
  const popRef = useRef<HTMLSpanElement>(null);
  const [saving, setSaving] = useState(false);
  const [proposals, setProposals] = useState<AiProposal[] | null>(null);
  /** Merchant names to stream under the beam while the model reads them. */
  const [merchants, setMerchants] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  const loadState = useCallback(() => {
    fetch("/api/transactions/recategorize")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.ai && setAi(d.ai))
      .catch(() => {});
  }, []);
  useEffect(loadState, [loadState]);

  // Statement months, and how many spends each scope would send.
  useEffect(() => {
    if (!open || months) return;
    fetch("/api/transactions?type=debit&limit=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list: string[] = d?.months ?? [];
        setMonths(list);
        setCounts((c) => ({ ...c, all: Number(d?.total ?? 0) }));
        setMonth((m) => m ?? list[0] ?? null);
      })
      .catch(() => setMonths([]));
  }, [open, months]);

  useEffect(() => {
    if (!open || !month || counts[month] !== undefined) return;
    fetch(`/api/transactions?type=debit&month=${month}&limit=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCounts((c) => ({ ...c, [month]: Number(d.total ?? 0) })))
      .catch(() => {});
  }, [open, month, counts]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!popRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!ai?.configured) return null;

  const scopeLabel = (m: string | null) => (m ? `the ${monthTitle(m)} statement` : "every statement");

  async function run(scope: string | null) {
    setOpen(false);
    setRan(scope);
    setBusy(true);
    play("scan");
    fetch(`/api/transactions?type=debit&limit=60${scope ? `&month=${scope}` : ""}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const names: string[] = (d?.transactions ?? []).map((t: { description: string }) => t.description);
        if (names.length) setMerchants(names);
      })
      .catch(() => {});
    const res = await fetch("/api/transactions/recategorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scope ? { month: scope } : {}),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setBusy(false);
    setMerchants([]);
    if (data?.ai) setAi(data.ai);
    if (!res?.ok) {
      toast.push(data?.error ?? "The review could not be run.", {
        tone: "bad",
        duration: 9000,
        action: { label: "Try again", onClick: () => run(scope) },
      });
      return;
    }
    setReviewed(Number(data.reviewed ?? 0));
    const list: AiProposal[] = data.proposals ?? [];
    if (!list.length) {
      play("success");
      toast.push("Nothing to change", {
        detail: `All ${data.reviewed} spends on ${scopeLabel(scope)} already look right.`,
        tone: "good",
      });
      return;
    }
    setDecisions(Object.fromEntries(list.map((p) => [p.id, { keep: true, category: p.to }])));
    setProposals(list);
    play("sparkle");
  }

  async function apply() {
    if (!proposals) return;
    const changes = proposals
      .filter((p) => decisions[p.id]?.keep && decisions[p.id].category !== p.from)
      .map((p) => ({ id: p.id, category: decisions[p.id].category }));
    if (!changes.length) {
      setProposals(null);
      toast.push("Nothing applied", { detail: "Every suggestion was left out.", tone: "info" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/transactions/recategorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      toast.push("Those changes could not be saved.", { tone: "bad" });
      return;
    }
    play("settle");
    setProposals(null);
    toast.push(`${changes.length} categor${changes.length === 1 ? "y" : "ies"} updated`, { tone: "good" });
    onApplied();
  }

  const kept = proposals?.filter((p) => decisions[p.id]?.keep).length ?? 0;

  return (
    <>
      <span ref={popRef} className="sweep-wrap">
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={busy || ai.remaining === 0}
          aria-expanded={open}
          title={
            ai.remaining === 0
              ? "Both runs for this month are used. They come back on the 1st."
              : "Ask AI to re-sort a statement month or every statement, then review what it wants to change"
          }
          className="sweep-btn"
        >
          <BotMark />
          {busy ? "Recategorising…" : "Recategorise"}
          <span className="sweep-left">{ai.remaining} left this month</span>
        </button>

        {open && (
          <div className="sweep-pop" role="dialog" aria-label="What to recategorise">
            <p className="sweep-pop-title">What should AI look at?</p>
            <button
              type="button"
              onClick={() => months?.length && setMonth((m) => m ?? months[0])}
              className={`sweep-scope ${month ? "is-on" : ""}`}
              aria-pressed={Boolean(month)}
            >
              <span className="sweep-scope-dot" aria-hidden />
              <span className="sweep-scope-main">
                <span className="sweep-scope-name">One statement month</span>
                <select
                  value={month ?? months?.[0] ?? ""}
                  onChange={(e) => setMonth(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={!months?.length}
                  aria-label="Statement month"
                  className="sweep-scope-month"
                >
                  {(months ?? []).map((m) => (
                    <option key={m} value={m}>
                      {monthTitle(m)} statement
                    </option>
                  ))}
                </select>
              </span>
              <span className="sweep-scope-n tabular">
                {month && counts[month] !== undefined ? `${counts[month]} spends` : ""}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMonth(null)}
              className={`sweep-scope ${month ? "" : "is-on"}`}
              aria-pressed={!month}
            >
              <span className="sweep-scope-dot" aria-hidden />
              <span className="sweep-scope-main">
                <span className="sweep-scope-name">Every statement</span>
                <span className="sweep-scope-hint">The whole history, in one pass</span>
              </span>
              <span className="sweep-scope-n tabular">{counts.all !== undefined ? `${counts.all} spends` : ""}</span>
            </button>
            <button type="button" onClick={() => run(month)} className="sweep-go" disabled={months === null}>
              Start review
            </button>
            <p className="sweep-pop-foot">
              Either uses one of your {ai.limit} runs. Nothing is saved until you have looked it over.
            </p>
          </div>
        )}
      </span>

      {busy && (
        <AiOverlay
          kicker={ran ? `Checking the ${monthTitle(ran)} statement with AI` : "Checking every statement with AI"}
          title="Reading each transaction and working out what it is"
          footnote="One of your two monthly runs. Only merchant names are sent, never amounts or card details. Nothing is saved until you review it."
          merchants={merchants}
          stages={REVIEW_STAGES}
        />
      )}

      {proposals &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="sweep-scrim" role="dialog" aria-modal="true" aria-label="Review category changes">
            <div className="sweep-panel">
              <div className="sweep-head">
                <div>
                  <h2 className="sweep-title">Review before anything changes</h2>
                  <p className="sweep-sub">
                    Read {reviewed} spends on {scopeLabel(ran)} and would change{" "}
                    <span className="text-ink">{proposals.length}</span>. Nothing is saved until you apply.
                  </p>
                </div>
                <span className="sweep-count tabular">
                  {kept}/{proposals.length}
                </span>
              </div>

              <div className="sweep-bulk">
                <button onClick={() => setDecisions((d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, { ...v, keep: true }])))}>
                  Select all
                </button>
                <button onClick={() => setDecisions((d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, { ...v, keep: false }])))}>
                  Select none
                </button>
              </div>

              <ul className="sweep-list">
                {proposals.map((p) => {
                  const d = decisions[p.id];
                  return (
                    <li key={p.id} className={`sweep-row ${d?.keep ? "" : "is-out"}`}>
                      <input
                        type="checkbox"
                        checked={d?.keep ?? false}
                        onChange={(e) =>
                          setDecisions((prev) => ({ ...prev, [p.id]: { ...prev[p.id], keep: e.target.checked } }))
                        }
                        aria-label={`Apply the change to ${p.description}`}
                      />
                      <BankBadge bankId={p.bankId} size={20} />
                      <span className="sweep-main">
                        <span className="sweep-desc">{p.description}</span>
                        <span className="sweep-meta">
                          {p.cardLabel} •••• {p.last4 ?? "????"} · {p.txnDate} · {inr(p.amount)}
                        </span>
                      </span>
                      <span className="sweep-from">{p.from}</span>
                      <span className="sweep-arrow" aria-hidden>
                        →
                      </span>
                      <CategorySelect
                        value={d?.category ?? p.to}
                        onChange={(next) =>
                          setDecisions((prev) => ({ ...prev, [p.id]: { keep: true, category: next } }))
                        }
                        label={`Category for ${p.description}`}
                      />
                    </li>
                  );
                })}
              </ul>

              <div className="sweep-foot">
                <button
                  onClick={() => {
                    setProposals(null);
                    toast.push("Changes discarded", { detail: "Nothing was saved.", tone: "info" });
                  }}
                  className="sweep-cancel"
                >
                  Discard all
                </button>
                <button onClick={apply} disabled={saving} className="sweep-apply">
                  {saving ? "Applying…" : `Apply ${kept} change${kept === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
