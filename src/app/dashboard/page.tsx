"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CreditCard from "@/components/CreditCard";
import DashboardView from "@/components/DashboardView";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import type { CardStat } from "@/components/CardRail";
import { billsByCard } from "@/lib/bills";
import { monthKey, monthTitle, Range, RANGE_LABELS } from "@/lib/format";
import { Analytics, CardRow, Timeline } from "@/lib/types";
import { getJson } from "@/lib/api";


export default function Dashboard() {
  const router = useRouter();
  // What the API falls back to when no month is chosen.
  const range: Range = "all";
  // Opens on this month, or the newest month holding anything if it is empty.
  const [month, setMonth] = useState<string | null>(() => monthKey());
  const [pinned, setPinned] = useState(false);
  const chooseMonth = useCallback((m: string | null) => {
    setPinned(true);
    setMonth(m);
  }, []);
  const [cardId, setCardId] = useState<string | null>(null);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [data, setData] = useState<Analytics | null>(null);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [checked, setChecked] = useState(false);
  const [loadedKey, setLoadedKey] = useState("");
  const [railRows, setRailRows] = useState<Analytics["byCard"]>([]);
  const [railDues, setRailDues] = useState<Analytics["dues"]>([]);
  const queryKey = `${month ?? range}|${cardId ?? "all"}`;

  const loadCards = useCallback(() => {
    getJson<{ cards: CardRow[] }>("/api/cards").then((d) => d && setCards(d.cards ?? []));
  }, []);

  useEffect(() => {
    getJson<{ hasProfile: boolean }>("/api/profile", () => router.replace("/login")).then((p) => {
      if (!p) return;
      if (!p.hasProfile) router.replace("/onboarding");
      else setChecked(true);
    });
    loadCards();
  }, [router, loadCards]);

  const onExpired = useCallback(() => router.replace("/login?expired=1"), [router]);


  const load = useCallback(() => {
    const q = new URLSearchParams(month ? { month } : { range });
    if (cardId) q.set("cardId", cardId);
    const key = `${month ?? range}|${cardId ?? "all"}`;
    getJson<Analytics>(`/api/analytics?${q}`, onExpired).then((d) => {
      if (!d || !d.totals) return;
      const months = d.months ?? [];
      if (!pinned && month && months.length && !months.includes(month)) {
        setPinned(true);
        setMonth(months[0]);
        return;
      }
      setData(d);
      setLoadedKey(key);
    });
  }, [month, range, cardId, onExpired, pinned]);

  // Loaded on its own so the recurring scan and the trend do not hold up the
  // figures, bills and breakdowns above them.
  const loadTimeline = useCallback(() => {
    const q = new URLSearchParams(month ? { month } : {});
    if (cardId) q.set("cardId", cardId);
    let live = true;
    getJson<Timeline>(`/api/analytics/timeline?${q}`, onExpired).then((d) => {
      if (live && d) setTimeline(d);
    });
    return () => {
      live = false;
    };
  }, [month, cardId, onExpired]);
  useEffect(() => {
    if (!checked) return;
    return loadTimeline();
  }, [checked, loadTimeline]);

  const loadRail = useCallback(() => {
    const q = new URLSearchParams(month ? { month } : { range });
    getJson<Analytics>(`/api/analytics?${q}`, onExpired).then((d) => {
      if (d?.byCard) {
        setRailRows(d.byCard);
        setRailDues(d.dues ?? []);
      }
    });
  }, [month, range, onExpired]);
  useEffect(() => {
    if (checked) loadRail();
  }, [checked, loadRail]);
  useEffect(() => {
    if (checked) load();
  }, [checked, load]);


  const cardStats = useMemo(() => {
    const bills = billsByCard(railDues, month);
    const map: Record<string, CardStat> = {};
    for (const row of railRows) {
      const bill = bills[row.card_id];
      map[row.card_id] = {
        debits: Number(row.debits),
        txns: Number(row.txns ?? 0),
        nextDue: row.next_due ?? null,
        nextDueAmount: row.next_due_amount != null ? Number(row.next_due_amount) : null,
        billedTxns: bill?.txns ?? null,
        bill: bill ? { amount: bill.amount, settled: bill.settled } : null,
      };
    }
    return map;
  }, [railRows, railDues, month]);

  if (!checked || !data) return <DashboardSkeleton />;

  const empty = Number(data.totals.txns) === 0 && !cardId && range === "all";
  const nothingYet = Number(data.totals.txns) === 0;
  const shownCard = cards.find((c) => c.id === cardId) ?? cards[0];

  if (cards.length === 0)
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <div className="card rise mx-auto flex max-w-2xl flex-col items-center gap-4 p-10 text-center sm:p-14">
          <span className="card-ghost card-ghost-lg" aria-hidden>
            <span className="card-ghost-plus">+</span>
          </span>
          <h2 className="text-lg font-medium">Add your first statement</h2>
          <p className="max-w-md text-sm text-ink2">
            Drop this month&apos;s PDFs. Outlay derives each password from your name and date of birth, reads the issuer
            and last four digits off the file, reconciles the totals against the figures the bank printed, and offers to
            add any card it does not recognise.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/upload"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Upload a statement
            </Link>
            <Link
              href="/settings"
              className="rounded-lg border border-line px-4 py-2 text-sm text-ink2 transition-colors hover:border-muted hover:text-ink"
            >
              Add a card by hand
            </Link>
          </div>
          <p className="text-xs text-muted">Files are parsed in memory and never written to disk.</p>
        </div>
      </div>
    );

  async function settle(id: string, settled: boolean) {
    // Reflect it at once; the refetch below confirms the figures.
    setData((prev) => (prev ? { ...prev, dues: prev.dues.map((d) => (d.id === id ? { ...d, settled } : d)) } : prev));
    const res = await fetch(`/api/statements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: settled }),
    });
    if (res.ok) {
      load();
      loadRail();
    } else {
      setData((prev) => (prev ? { ...prev, dues: prev.dues.map((d) => (d.id === id ? { ...d, settled: !settled } : d)) } : prev));
    }
  }

  return (
    <DashboardView
      title="Dashboard"
      cards={cards}
      data={data}
      timeline={timeline}
      month={month}
      months={data.months ?? []}
      onMonth={chooseMonth}
      activeId={cardId}
      onSelectCard={setCardId}
      cardStats={cardStats}
      viewKey={queryKey}
      dimmed={loadedKey !== queryKey}
      stats={
        cardId && loadedKey === queryKey
          ? {
              rangeLabel: month ? monthTitle(month) : RANGE_LABELS[range],
              debits: Number(data.totals.debits),
              credits: Number(data.totals.credits),
              fees: Number(data.totals.fees),
              txns: Number(data.totals.txns),
            }
          : null
      }
      onCardsChanged={() => {
        loadCards();
        load();
        loadRail();
      }}
      empty={
        nothingYet ? (
          <div className="card flex flex-col items-center gap-3 p-14 text-center">
            {shownCard && (
              <div className="float mb-2 w-52">
                <CreditCard bankId={shownCard.bank_id} label={shownCard.card_label} last4={shownCard.last4} size="sm" />
              </div>
            )}
            <p className="text-lg font-medium">
              {empty ? "No statements yet" : cardId ? "No spend on this card in this period" : "No spend in this period"}
            </p>
            <p className="max-w-md text-sm text-ink2">
              {empty
                ? "Upload a statement PDF. Outlay unlocks it, verifies it against the printed totals, and breaks down the spend here."
                : "Pick another month, or upload the statements covering this one."}
            </p>
            <Link href="/upload" className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Upload a statement
            </Link>
          </div>
        ) : null
      }
      onSettle={settle}
    />
  );
}
