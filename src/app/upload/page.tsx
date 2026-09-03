"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BankBadge from "@/components/BankBadge";
import CheckList from "@/components/CheckList";
import CheckSummary from "@/components/CheckSummary";
import TxnTable from "@/components/TxnTable";
import TxnEditor from "@/components/TxnEditor";
import { useToast } from "@/components/Toasts";
import { getJson } from "@/lib/api";
import { inr } from "@/lib/format";
import { BANKS, bankById } from "@/lib/banks";
import { runChecks } from "@/lib/checks";
import type { Detection } from "@/lib/detect";
import { CardRow, Check, ParsedTxn, StatementSummary } from "@/lib/types";


interface Parsed {
  filename: string;
  unlocked: boolean;
  parser: "ai" | "heuristic";
  detection: Detection;
  matchedCardId: string | null;
  matchNote: string | null;
  summary: StatementSummary;
  transactions: ParsedTxn[];
  checks: Check[];
}

type Status = "queued" | "working" | "ready" | "needs-card" | "needs-password" | "rejected" | "failed" | "saved";

interface Item {
  id: string;
  file: File;
  status: Status;
  parsed?: Parsed;
  error?: string;
  cardId?: string | null;
  newCardLabel?: string;
  newCardBank?: string;
  linking?: boolean;
  settled?: boolean;
  password?: string;
}

const STATUS_LABEL: Record<Status, string> = {
  queued: "Queued",
  working: "Reading",
  ready: "Ready",
  "needs-card": "Card needed",
  "needs-password": "Password needed",
  rejected: "Not a statement",
  failed: "Failed",
  saved: "Saved",
};

const STATUS_CLASS: Record<Status, string> = {
  queued: "border-line text-muted",
  working: "border-accent/50 bg-accentSoft text-accent",
  ready: "border-good/40 bg-good/10 text-good",
  "needs-card": "border-warn/40 bg-warn/10 text-warn",
  "needs-password": "border-warn/40 bg-warn/10 text-warn",
  rejected: "border-bad/40 bg-bad/10 text-bad",
  failed: "border-bad/40 bg-bad/10 text-bad",
  saved: "border-good/40 bg-good/10 text-good",
};

export default function Upload() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const toast = useToast();

  const loadCards = () => getJson<{ cards: CardRow[] }>("/api/cards").then((d) => d && setCards(d.cards ?? []));
  useEffect(() => {
    loadCards();
  }, []);

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const incoming = Array.from(list).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    const skipped = Array.from(list).length - incoming.length;
    if (skipped > 0) toast.push(`${skipped} file(s) skipped`, { detail: "Only PDF statements are accepted.", tone: "warn" });
    if (!incoming.length) return;
    setItems((prev) => [
      ...prev,
      ...incoming.map((file) => ({ id: `${file.name}-${file.size}-${Math.round(file.lastModified)}`, file, status: "queued" as Status })),
    ]);
  }

  async function parseOne(item: Item, overrides?: { password?: string }): Promise<Item> {
    const form = new FormData();
    form.set("file", item.file);
    if (item.cardId) form.set("cardId", item.cardId);
    const password = overrides?.password ?? item.password;
    if (password) form.set("password", password);

    const res = await fetch("/api/statements/parse", { method: "POST", body: form });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (data?.notAStatement) return { ...item, status: "rejected", error: data.error };
      if (data?.needsPassword) return { ...item, status: "needs-password", error: data.error };
      return { ...item, status: "failed", error: data?.error ?? "Could not read this file." };
    }
    const parsed = data as Parsed;
    return {
      ...item,
      parsed,
      cardId: item.cardId ?? parsed.matchedCardId ?? null,
      status: item.cardId ?? parsed.matchedCardId ? "ready" : "needs-card",
    };
  }

  function applyEdits(itemId: string, next: ParsedTxn[]) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId || !i.parsed) return i;
        const kept = i.parsed.checks.filter((c) => c.id === "continuity" || c.id === "duplicate-statement");
        const parsed = { ...i.parsed, transactions: next };
        return {
          ...i,
          parsed: { ...parsed, checks: [...runChecks({ parser: "heuristic", summary: parsed.summary, transactions: next }, []), ...kept], edited: true },
        };
      })
    );
  }

  function failedChecksum(checks: Check[]) {
    return checks.some((c) => (c.id === "debit-tally" || c.id === "credit-tally") && c.status === "fail");
  }

  async function runQueue() {
    setBusy(true);
    const pending = items.filter((i) => i.status === "queued" || i.status === "needs-password");
    for (const item of pending) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "working" } : i)));
      const current = items.find((i) => i.id === item.id) ?? item;
      const done = await parseOne(current);
      setItems((prev) => prev.map((i) => (i.id === item.id ? done : i)));
    }
    setBusy(false);
  }

  function suggestedName(d?: Parsed["detection"]): string {
    if (d?.productName) return d.productName;
    if (!d?.bankId) return "";
    return d.last4 ? `${bankById(d.bankId).name} ${d.last4}` : `${bankById(d.bankId).name} card`;
  }

  async function createCardFor(item: Item) {
    const d = item.parsed?.detection;
    const bankId = item.newCardBank ?? d?.bankId ?? "other";
    const label = item.newCardLabel?.trim() || suggestedName(d) || `${bankById(bankId).name} card`;
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankId, cardLabel: label, last4: d?.last4 ?? undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.push("Could not add card", { detail: data.error, tone: "bad" });
      return;
    }
    await loadCards();
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, cardId: data.id, status: "ready" } : i)));
    toast.push("Card added", { detail: label, tone: "good" });
  }

  async function saveAll() {
    setBusy(true);
    let saved = 0;
    for (const item of items.filter((i) => i.status === "ready" && i.parsed && i.cardId)) {
      const res = await fetch("/api/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: item.cardId, ...item.parsed, paid: item.settled ?? false }),
      });
      if (res.ok) {
        saved++;
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "saved" } : i)));
      } else {
        const data = await res.json().catch(() => ({}));
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "failed", error: data.error } : i)));
      }
    }
    setBusy(false);
    if (saved) {
        toast.push(`${saved} statement${saved === 1 ? "" : "s"} saved`, { tone: "good" });
      setTimeout(() => router.push("/statements"), 800);
    }
  }

  const counts = {
    total: items.length,
    ready: items.filter((i) => i.status === "ready").length,
    needsCard: items.filter((i) => i.status === "needs-card").length,
    needsPassword: items.filter((i) => i.status === "needs-password").length,
    rejected: items.filter((i) => i.status === "rejected" || i.status === "failed").length,
    saved: items.filter((i) => i.status === "saved").length,
  };
  const parsedCount = items.filter((i) => i.parsed).length;
  const canParse = items.some((i) => i.status === "queued" || i.status === "needs-password");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Upload statements</h1>
        <p className="mt-1 text-sm text-ink2">
          Drop one file or a whole month of them. Each statement is unlocked and read in memory, the card is identified
          from the statement itself, and nothing is saved until you approve the batch.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed p-8 text-center transition-all duration-200 ${
          dragOver ? "dropzone-active scale-[1.01] border-accent bg-accentSoft" : "border-line hover:border-muted"
        }`}
      >
        <p className="text-sm font-medium">Drop statement PDFs here, or click to browse</p>
        <p className="text-xs text-muted">
          Multiple files welcome. Password-protected files unlock automatically from your profile.
        </p>
        <input ref={fileRef} type="file" accept="application/pdf" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>

      {items.length > 0 && (
        <div className="card rise p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-medium text-ink2">Review ({items.length})</h2>
            <div className="ml-auto flex flex-wrap gap-2 text-xs">
              {counts.ready > 0 && <span className="rounded-md border border-good/40 bg-good/10 px-2 py-1 text-good">{counts.ready} ready</span>}
              {counts.needsCard > 0 && <span className="rounded-md border border-warn/40 bg-warn/10 px-2 py-1 text-warn">{counts.needsCard} need a card</span>}
              {counts.needsPassword > 0 && <span className="rounded-md border border-warn/40 bg-warn/10 px-2 py-1 text-warn">{counts.needsPassword} need a password</span>}
              {counts.rejected > 0 && <span className="rounded-md border border-bad/40 bg-bad/10 px-2 py-1 text-bad">{counts.rejected} rejected</span>}
              {counts.saved > 0 && <span className="rounded-md border border-good/40 bg-good/10 px-2 py-1 text-good">{counts.saved} saved</span>}
            </div>
          </div>

          <ul className="space-y-2">
            {items.map((item, i) => {
              const card = cards.find((c) => c.id === item.cardId) ?? null;
              const d = item.parsed?.detection;
              return (
                <li
                  key={item.id}
                  className="rise rounded-lg border border-line p-3"
                  style={{ "--d": `${Math.min(i, 10) * 45}ms` } as React.CSSProperties}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] ${STATUS_CLASS[item.status]}`}>
                      {item.status === "working" ? <span className="spinner mr-1.5" /> : null}
                      {STATUS_LABEL[item.status]}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm" title={item.file.name}>
                      {item.file.name}
                    </span>
                    {item.parsed && (
                      <span className="text-xs text-muted tabular">
                        {item.parsed.transactions.length} txns · {inr(item.parsed.transactions.filter((t) => t.type === "debit").reduce((a, t) => a + t.amount, 0))}
                      </span>
                    )}
                    <button
                      onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                      aria-label={`Remove ${item.file.name}`}
                      className="rounded p-1 text-muted hover:text-bad"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {item.error && <p className="mt-1.5 text-xs text-bad">{item.error}</p>}

                  {item.status === "needs-password" && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="password"
                        placeholder="Statement password"
                        onChange={(e) =>
                          setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, password: e.target.value } : x)))
                        }
                        className="w-56 rounded-lg border border-line bg-surface2 px-3 py-1.5 text-sm outline-none focus:border-accent"
                      />
                      <button
                        onClick={async () => {
                          setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: "working" } : x)));
                          const done = await parseOne(item, { password: item.password });
                          setItems((prev) => prev.map((x) => (x.id === item.id ? done : x)));
                        }}
                        className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {(item.status === "needs-card" || item.status === "ready") && item.parsed && (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {card ? (
                          <span className="flex min-w-0 items-center gap-2 text-xs">
                            <BankBadge bankId={card.bank_id} size={26} />
                            <span className="min-w-0">
                              <span className="block truncate text-ink">
                                {card.card_label}
                                {card.last4 && <span className="ml-1.5 text-muted tabular">•••• {card.last4}</span>}
                              </span>
                              {d?.confidence === "high" && item.parsed.matchedCardId === card.id && (
                                <span className="block text-[10px] text-good">matched from the statement</span>
                              )}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-warn">
                            {item.parsed.matchNote ??
                              (d?.bankName
                                ? `${d.bankName}${d.last4 ? ` ending ${d.last4}` : ""} is not one of your cards yet`
                                : "This statement's card could not be identified")}
                          </span>
                        )}
                        <button
                          onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                          className="ml-auto rounded-lg border border-line px-2.5 py-1 text-xs text-ink2 hover:border-muted"
                        >
                          {expanded === item.id ? "Hide detail" : "Review detail"}
                        </button>
                      </div>

                      {card ? (
                        <button
                          onClick={() => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, linking: true, cardId: null, status: "needs-card" } : x)))}
                          className="text-xs text-accent hover:underline"
                        >
                          Wrong card? Choose a different one
                        </button>
                      ) : item.linking || !d?.bankId ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={item.cardId ?? ""}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x) =>
                                  x.id === item.id
                                    ? { ...x, cardId: e.target.value || null, status: e.target.value ? "ready" : "needs-card", linking: !e.target.value }
                                    : x
                                )
                              )
                            }
                            className="max-w-[18rem] rounded-lg border border-line bg-surface2 px-2 py-1 text-xs text-ink2 outline-none focus:border-accent"
                            aria-label="Card for this statement"
                          >
                            <option value="">Choose one of your cards</option>
                            {cards.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.bank_name} · {c.card_label}
                                {c.last4 ? ` · ${c.last4}` : ""}
                              </option>
                            ))}
                          </select>
                          {!d?.bankId && (
                            <>
                              <span className="text-xs text-muted">or add it as</span>
                              <select
                                value={item.newCardBank ?? "other"}
                                onChange={(e) =>
                                  setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, newCardBank: e.target.value } : x)))
                                }
                                aria-label="Issuer for the new card"
                                className="rounded-lg border border-line bg-surface2 px-2 py-1 text-xs text-ink2 outline-none focus:border-accent"
                              >
                                {BANKS.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name}
                                  </option>
                                ))}
                              </select>
                              <input
                                value={item.newCardLabel ?? suggestedName(d)}
                                placeholder="Card name"
                                onChange={(e) =>
                                  setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, newCardLabel: e.target.value } : x)))
                                }
                                aria-label="Name for the new card"
                                className="w-40 rounded-lg border border-line bg-surface2 px-2 py-1 text-xs outline-none focus:border-accent"
                              />
                            </>
                          )}
                          {!d?.bankId && item.newCardLabel?.trim() && (
                            <button
                              onClick={() => createCardFor(item)}
                              className="rounded-lg border border-accent bg-accentSoft px-2.5 py-1 text-xs text-accent"
                            >
                              Add it
                            </button>
                          )}
                          {d?.bankId && (
                            <button
                              onClick={() =>
                                setItems((prev) =>
                                  prev.map((x) =>
                                    x.id === item.id ? { ...x, linking: false, cardId: null, status: "needs-card" } : x
                                  )
                                )
                              }
                              className="text-xs text-accent hover:underline"
                            >
                              Back to adding it
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={item.newCardBank ?? d.bankId ?? "other"}
                            onChange={(e) =>
                              setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, newCardBank: e.target.value } : x)))
                            }
                            aria-label="Issuer for the new card"
                            className="rounded-lg border border-line bg-surface2 px-2 py-1 text-xs text-ink2 outline-none focus:border-accent"
                          >
                            {BANKS.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                          <input
                            value={item.newCardLabel ?? suggestedName(d)}
                            onChange={(e) =>
                              setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, newCardLabel: e.target.value } : x)))
                            }
                            placeholder="Card name"
                            aria-label="Name for the new card"
                            className="w-40 rounded-lg border border-line bg-surface2 px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                          />
                          <button
                            onClick={() => createCardFor(item)}
                            disabled={!(item.newCardLabel ?? suggestedName(d)).trim()}
                            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-40"
                          >
                            Add this card
                          </button>
                          <span className="text-xs text-muted">or</span>
                          <button
                            onClick={() => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, linking: true } : x)))}
                            className="text-xs text-accent hover:underline"
                          >
                            it is a card I already added
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {expanded === item.id && item.parsed && (
                    <div className="rise mt-3 space-y-3 border-t border-line pt-3">
                      <CheckSummary checks={item.parsed.checks} />
                      <CheckList checks={item.parsed.checks} />
                      {editing === item.id ? (
                        <TxnEditor
                          txns={item.parsed.transactions}
                          summary={item.parsed.summary}
                          onChange={(next) => applyEdits(item.id, next)}
                          onClose={() => setEditing(null)}
                        />
                      ) : (
                        <>
                          <label className="flex cursor-pointer items-center gap-2 text-xs text-ink2">
                            <input
                              type="checkbox"
                              checked={item.settled ?? false}
                              onChange={(e) =>
                                setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, settled: e.target.checked } : x)))
                              }
                            />
                            This bill is already settled
                            <span className="text-muted">so it stops appearing as due</span>
                          </label>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted">
                              {failedChecksum(item.parsed.checks)
                                ? "The totals do not match what the statement printed. Correct the rows before saving."
                                : "Something read wrong? Correct it before saving."}
                            </p>
                            <button
                              onClick={() => setEditing(item.id)}
                              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs ${
                                failedChecksum(item.parsed.checks)
                                  ? "bg-accent font-medium text-white hover:opacity-90"
                                  : "border border-line text-ink2 hover:border-muted"
                              }`}
                            >
                              Edit transactions
                            </button>
                          </div>
                          <div className="max-h-72 overflow-y-auto">
                            <TxnTable txns={item.parsed.transactions} />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={runQueue}
              disabled={busy || !canParse}
              className={`rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 ${busy ? "btn-busy disabled:opacity-90" : ""}`}
            >
              {busy ? <><span className="spinner mr-2" />Reading…</> : `Read ${items.filter((i) => i.status === "queued").length || ""} file(s)`}
            </button>
            <button
              onClick={saveAll}
              disabled={busy || counts.ready === 0}
              className="rounded-lg border border-good/50 bg-good/10 px-4 py-2 text-sm font-medium text-good hover:bg-good/20 disabled:opacity-40"
            >
              Save {counts.ready || ""} statement(s)
            </button>
            <button
              onClick={() => setItems([])}
              disabled={busy}
              className="rounded-lg border border-line px-4 py-2 text-sm text-ink2 hover:border-muted disabled:opacity-40"
            >
              Clear
            </button>
          </div>
          {parsedCount > 0 && (
            <p className="mt-3 text-xs text-muted">
              Cards are identified from the issuer name and masked digits printed on each statement. Anything unmatched
              waits here for you rather than being guessed.
            </p>
          )}
        </div>
      )}

      {items.length === 0 && cards.length === 0 && (
        <p className="text-sm text-muted">
          No cards yet. Upload a statement and Outlay will offer to create the card from what it reads.
        </p>
      )}
      {BANKS.length === 0 && null}
    </div>
  );
}
