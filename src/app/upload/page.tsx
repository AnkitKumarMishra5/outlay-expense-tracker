"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BankBadge from "@/components/BankBadge";
import CheckList from "@/components/CheckList";
import CheckSummary from "@/components/CheckSummary";
import TxnTable from "@/components/TxnTable";
import TxnEditor from "@/components/TxnEditor";
import AiOverlay, { BotMark, OverlayCard } from "@/components/AiOverlay";
import CategorySelect from "@/components/CategorySelect";
import { play } from "@/lib/sound";
import type { AiChange, AiStatementResult } from "@/lib/aiReview";
import { useToast } from "@/components/Toasts";
import { getJson } from "@/lib/api";
import { inr } from "@/lib/format";
import { BANKS, bankById } from "@/lib/banks";
import { runChecks, sameStatement } from "@/lib/checks";
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

type Status = "queued" | "working" | "ready" | "needs-card" | "needs-password" | "rejected" | "failed" | "ai" | "saved";

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
  /** Run the AI category review after saving. Defaults to on when a review is available. */
  useAi?: boolean;
  aiNote?: string;
  aiTone?: "good" | "warn" | "bad";
  statementId?: string;
}

/** One file, however many times it is dropped. */
const fileId = (f: File) => `${f.name}-${f.size}-${Math.round(f.lastModified)}`;

interface AiInfo {
  configured: boolean;
  limit: number;
}

interface AiProgress {
  /** Every card in the batch, in the order its statements were saved. */
  deck: OverlayCard[];
  merchants: string[];
  statements: number;
  cards: number;
}

interface AiOutcome {
  statements: (AiStatementResult & { file: string; card: CardRow | null })[];
  error?: string;
}

const STATUS_LABEL: Record<Status, string> = {
  queued: "Queued",
  working: "Reading",
  ready: "Ready",
  "needs-card": "Card needed",
  "needs-password": "Password needed",
  rejected: "Not a statement",
  failed: "Failed",
  ai: "Categorising",
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
  ai: "border-accent/50 bg-accentSoft text-accent",
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
  const [ai, setAi] = useState<AiInfo>({ configured: false, limit: 2 });
  const [aiProgress, setAiProgress] = useState<AiProgress | null>(null);
  const [aiOutcome, setAiOutcome] = useState<AiOutcome | null>(null);
  const [aiEdits, setAiEdits] = useState<Record<string, string>>({});
  const outcomeRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (aiOutcome) outcomeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [aiOutcome]);

  const loadCards = () =>
    getJson<{ cards: CardRow[]; ai?: AiInfo }>("/api/cards").then((d) => {
      if (!d) return;
      setCards(d.cards ?? []);
      if (d.ai) setAi(d.ai);
    });

  /** AI reviews still available on a card this month. */
  const aiLeft = (cardId: string | null | undefined) => {
    if (!cardId) return 0;
    const card = cards.find((c) => c.id === cardId);
    return Math.max(0, ai.limit - (card?.ai_used ?? 0));
  };
  const wantsAi = (item: Item) => ai.configured && (item.useAi ?? true);
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
    const have = new Set(items.map((i) => i.id));
    const fresh = incoming.filter((f, k) => !have.has(fileId(f)) && incoming.findIndex((g) => fileId(g) === fileId(f)) === k);
    if (fresh.length < incoming.length) {
      const n = incoming.length - fresh.length;
      toast.push(`${n} file${n === 1 ? " is" : "s are"} already in the list`, { detail: "The same file was added twice, so it is only read once.", tone: "warn" });
    }
    if (!fresh.length) return;
    play("drop");
    setItems((prev) => [...prev, ...fresh.map((file) => ({ id: fileId(file), file, status: "queued" as Status }))]);
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
        const kept = i.parsed.checks.filter((c) => c.id === "continuity" || c.id === "already-saved");
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
      play(done.parsed ? "read" : "error");
      setItems((prev) => prev.map((i) => (i.id === item.id ? done : i)));
    }
    setBusy(false);
  }

  /** Fix one of the AI's picks by hand. Saves at once. */
  async function adjust(change: AiChange, next: string) {
    setAiEdits((prev) => ({ ...prev, [change.id]: next }));
    const res = await fetch(`/api/transactions/${change.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: next }),
    });
    if (res.ok) play("tick");
    else toast.push("Could not change that category", { tone: "bad" });
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
    setAiOutcome(null);
    let saved = 0;
    const targets = items.filter((i) => i.status === "ready" && i.parsed && i.cardId && !duplicates.has(i.id));
    const patch = (id: string, next: Partial<Item>) =>
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...next } : i)));
    const spentCopy = "This card has had both of its AI reviews this month, so the keyword categories were kept. They come back on the 1st.";

    // Save everything first. AI only ever looks at statements that are already kept.
    const review: { statementId: string; item: Item }[] = [];
    for (const item of targets) {
      const res = await fetch("/api/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: item.cardId, ...item.parsed, paid: item.settled ?? false }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        patch(item.id, { status: "failed", error: data.error });
        continue;
      }
      saved++;
      const { id: statementId } = (await res.json().catch(() => ({}))) as { id?: string };
      if (wantsAi(item) && statementId && aiLeft(item.cardId) > 0) {
        review.push({ statementId, item });
        patch(item.id, { status: "ai", statementId });
      } else {
        patch(item.id, {
          status: "saved",
          statementId,
          aiTone: "warn",
          aiNote: wantsAi(item) ? spentCopy : undefined,
        });
      }
    }
    if (saved) toast.push(`${saved} statement${saved === 1 ? "" : "s"} saved`, { tone: "good" });
    if (!review.length) {
      setBusy(false);
      if (saved) setTimeout(() => router.push("/statements"), 800);
      return;
    }

    // One model call for the whole batch, one review off each card involved.
    play("scan");
    const deck = [...new Set(review.map((r) => r.item.cardId))]
      .map((id) => cards.find((c) => c.id === id))
      .filter((c): c is CardRow => Boolean(c))
      .map((c) => ({ bankId: c.bank_id, label: c.card_label, last4: c.last4 }));
    setAiProgress({
      deck,
      merchants: review.flatMap((r) => r.item.parsed!.transactions.map((t) => t.description)),
      statements: review.length,
      cards: new Set(review.map((r) => r.item.cardId)).size,
    });
    const r = await fetch("/api/statements/recategorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statementIds: review.map((x) => x.statementId) }),
    });
    const body = await r.json().catch(() => ({}));
    setAiProgress(null);
    setBusy(false);
    if (body?.cards) {
      setCards((prev) => prev.map((c) => (body.cards[c.id] ? { ...c, ai_used: body.cards[c.id].used } : c)));
    }
    const byId = new Map(review.map((x) => [x.statementId, x.item]));
    if (!r.ok) {
      const error = body.error ?? "The AI could not review these statements right now. Your categories are unchanged, and this did not use up a review.";
      for (const x of review) patch(x.item.id, { status: "saved", aiTone: "warn", aiNote: error });
      toast.push("AI review did not happen", { detail: error, tone: "warn", duration: 7000 });
      setAiOutcome({ statements: [], error });
      return;
    }
    play("sparkle");
    const results = (body.statements ?? []) as AiStatementResult[];
    for (const st of results) {
      const item = byId.get(st.id);
      if (!item) continue;
      patch(item.id, {
        status: "saved",
        aiTone: st.skipped ? "warn" : "good",
        aiNote: st.skipped
          ? spentCopy
          : st.changed === 0
            ? `AI looked at all ${st.reviewed} categories and they were already right.`
            : `AI refined ${st.changed} of ${st.reviewed} categories, shown below.`,
      });
    }
    setAiOutcome({
      statements: results.map((st) => ({
        ...st,
        file: byId.get(st.id)?.file.name ?? "",
        card: cards.find((c) => c.id === st.cardId) ?? null,
      })),
    });
  }

  /**
   * Statements that would double-count: already saved for their card, or a
   * second copy of one earlier in this batch. They are named here and left
   * out of saving, rather than failing one by one when Save is pressed.
   */
  const duplicates = new Map<string, string>();
  items.forEach((item, i) => {
    if (!item.parsed || !item.cardId || item.status === "saved") return;
    const saved =
      item.parsed.matchedCardId === item.cardId &&
      item.parsed.checks.some((c) => c.id === "already-saved" && c.status === "fail");
    if (saved) {
      duplicates.set(item.id, "This statement is already saved for this card, so it will be skipped.");
      return;
    }
    const first = items
      .slice(0, i)
      .find((o) => o.parsed && o.cardId === item.cardId && sameStatement(o.parsed.summary, item.parsed!.summary));
    if (first) duplicates.set(item.id, `Same statement as “${first.file.name}” above, on the same card. It will be skipped.`);
  });

  const counts = {
    total: items.length,
    ready: items.filter((i) => i.status === "ready" && !duplicates.has(i.id)).length,
    duplicates: duplicates.size,
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
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Choose statement PDFs to upload"
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed p-8 text-center outline-none transition-all duration-200 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 ${
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
              {counts.duplicates > 0 && <span className="rounded-md border border-bad/40 bg-bad/10 px-2 py-1 text-bad">{counts.duplicates} duplicate</span>}
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
                      // The amount the bill comes to is the headline figure on
                      // the statement, so it is the headline figure here too.
                      <span className="flex shrink-0 items-baseline gap-1.5">
                        <span className="text-[11px] text-muted tabular">
                          {item.parsed.transactions.length} txns
                        </span>
                        <span className="text-base font-semibold tracking-tight text-ink tabular sm:text-lg">
                          {item.parsed.summary.totalDue != null
                            ? inr(item.parsed.summary.totalDue)
                            : inr(
                                item.parsed.transactions
                                  .filter((t) => t.type === "debit")
                                  .reduce((a, t) => a + t.amount, 0)
                              )}
                        </span>
                        <span className="text-[11px] text-muted">
                          {item.parsed.summary.totalDue != null ? "due" : "spends"}
                        </span>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        play("delete");
                        setItems((prev) => prev.filter((x) => x.id !== item.id));
                      }}
                      aria-label={`Remove ${item.file.name}`}
                      className="rounded p-1 text-muted hover:text-bad"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {item.error && <p className="mt-1.5 text-xs text-bad">{item.error}</p>}
                  {duplicates.has(item.id) && (
                    <p className="mt-2 flex flex-wrap items-baseline gap-x-2 rounded-md border border-bad/40 bg-bad/10 px-2.5 py-1.5 text-xs">
                      <span className="font-medium text-bad">Duplicate</span>
                      <span className="text-ink2">{duplicates.get(item.id)}</span>
                    </p>
                  )}
                  {item.aiNote && (
                    <p className={`mt-1.5 text-xs ${item.aiTone === "good" ? "text-good" : item.aiTone === "bad" ? "text-bad" : "text-warn"}`}>
                      {item.aiNote}
                    </p>
                  )}

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
                        <div className="space-y-1.5">
                          <button
                            onClick={() => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, linking: true, cardId: null, status: "needs-card" } : x)))}
                            className="text-xs text-accent hover:underline"
                          >
                            Wrong card? Choose a different one
                          </button>
                          {(() => {
                            const due = item.parsed.summary.dueDate;
                            return (
                            <label
                              className={`flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-2 text-xs ${
                                due ? "border-line text-ink2" : "border-warn/40 bg-warn/10 text-warn"
                              }`}
                            >
                              <span>
                                {due
                                  ? "Payment due date, as read off the statement. Correct it here if it looks wrong."
                                  : "No payment due date was printed where Outlay could read it. Add it so this bill can be tracked."}
                              </span>
                              <input
                                type="date"
                                aria-label="Payment due date"
                                value={item.parsed.summary.dueDate ?? ""}
                                onChange={(e) => {
                                  const dueDate = e.target.value || undefined;
                                  setItems((prev) =>
                                    prev.map((x) =>
                                      x.id === item.id && x.parsed
                                        ? { ...x, parsed: { ...x.parsed, summary: { ...x.parsed.summary, dueDate } } }
                                        : x
                                    )
                                  );
                                }}
                                className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                              />
                            </label>
                            );
                          })()}
                          {ai.configured && item.cardId && (
                            aiLeft(item.cardId) > 0 ? (
                              <label className="flex cursor-pointer flex-wrap items-center gap-2 text-xs text-ink2">
                                <input
                                  type="checkbox"
                                  checked={item.useAi ?? true}
                                  onChange={(e) =>
                                    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, useAi: e.target.checked } : x)))
                                  }
                                />
                                Review the categories with AI after saving
                                <span className="text-muted">
                                  {aiLeft(item.cardId)} of {ai.limit} AI reviews left for this card this month
                                </span>
                              </label>
                            ) : (
                              <p className="text-xs text-muted">
                                This card has had both of its AI reviews this month, so the keyword categories will be kept.
                                They come back on the 1st.
                              </p>
                            )
                          )}
                        </div>
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

      {aiProgress && (
        <AiOverlay
          kicker="Categorising your spends with AI"
          title={
            aiProgress.statements > 1
              ? `${aiProgress.statements} statements on ${aiProgress.cards} card${aiProgress.cards === 1 ? "" : "s"}, ${aiProgress.merchants.length} merchant names`
              : `Reading ${aiProgress.merchants.length} merchant names`
          }
          footnote="One of the two monthly AI reviews for each card here. Only merchant names are sent, never amounts or card details."
          cards={aiProgress.deck}
          merchants={aiProgress.merchants}
        />
      )}

      {aiOutcome && (
        <div ref={outcomeRef} className="card rise scroll-mt-20 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="ai-btn pointer-events-none px-2.5 py-1.5">
              <BotMark />
              <span className="text-xs">AI review</span>
            </span>
            <p className="text-sm text-ink2">
              {aiOutcome.error
                ? aiOutcome.error
                : (() => {
                    const reviewed = aiOutcome.statements.reduce((a, s) => a + s.reviewed, 0);
                    const changed = aiOutcome.statements.reduce((a, s) => a + s.changed, 0);
                    const files = aiOutcome.statements.filter((s) => !s.skipped).length;
                    return changed === 0
                      ? `Looked at all ${reviewed} categories across ${files} statement${files === 1 ? "" : "s"}. They were already right.`
                      : `Refined ${changed} of ${reviewed} categories across ${files} statement${files === 1 ? "" : "s"}.`;
                  })()}
            </p>
          </div>

          {aiOutcome.statements.some((s) => s.changes.length > 0 || s.skipped) && (
            <div className="mt-3 space-y-3">
              {aiOutcome.statements
                .filter((s) => s.changes.length > 0 || s.skipped)
                .map((s) => (
                  <div key={s.id} className="rounded-lg border border-line p-3">
                    <p className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="truncate text-ink" title={s.file}>{s.file}</span>
                      {s.card && (
                        <span className="text-muted">
                          {s.card.card_label} •••• {s.card.last4 ?? "????"}
                        </span>
                      )}
                      <span className={`ml-auto ${s.skipped ? "text-warn" : "text-good"}`}>
                        {s.skipped ? "AI reviews for this card are used this month" : `${s.changed} of ${s.reviewed} refined`}
                      </span>
                    </p>
                    {s.changes.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {s.changes.map((ch, i) => (
                          <li
                            key={ch.id}
                            className="ai-change-row flex flex-wrap items-center gap-2 rounded-md bg-surface2 px-2.5 py-1.5 text-xs"
                            style={{ "--d": `${Math.min(i, 12) * 40}ms` } as React.CSSProperties}
                          >
                            <span className="min-w-0 flex-1 truncate text-ink" title={ch.description}>{ch.description}</span>
                            <span className="text-muted line-through">{ch.from}</span>
                            <span className="text-muted" aria-hidden>→</span>
                            <CategorySelect
                              value={aiEdits[ch.id] ?? ch.to}
                              onChange={(next) => adjust(ch, next)}
                              label={`Category for ${ch.description}`}
                              flash={!aiEdits[ch.id]}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link href="/statements" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Continue to statements
            </Link>
            <Link href="/dashboard" className="rounded-lg border border-line px-4 py-2 text-sm text-ink2 hover:border-muted">
              Dashboard
            </Link>
            {aiOutcome.statements.some((s) => s.changes.length > 0) && (
              <span className="text-xs text-muted">Disagree with one? Pick another category above, it saves at once.</span>
            )}
          </div>
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
