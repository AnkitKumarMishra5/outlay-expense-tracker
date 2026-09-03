"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import DashboardView from "@/components/DashboardView";
import Logo from "@/components/Logo";
import { INVITE_MAILTO } from "@/lib/developer";
import { DEMO_CARDS } from "@/lib/demo";
import { demoAnalytics } from "@/lib/demoAnalytics";
import { Range, RANGE_LABELS } from "@/lib/format";
import { useReveal } from "@/lib/useReveal";
import { Analytics } from "@/lib/types";

const STEPS = [
  {
    n: "01",
    title: "Drop the PDFs in",
    body: "A month of statements at once. Outlay derives each password from your name and date of birth, opens the file in memory, and works out which card it belongs to from the text on the page.",
  },
  {
    n: "02",
    title: "It checks the bank's arithmetic",
    body: "Twelve checks per statement. Line items are added up and compared against the totals the bank printed, so a half-read statement announces itself instead of quietly skewing a year of numbers.",
  },
  {
    n: "03",
    title: "You get the picture above",
    body: "Spend by card, category and month. A calendar carrying both daily spend and every payment due. Fees itemised, because those are the ones worth arguing about.",
  },
];

export default function Landing() {
  const [range, setRange] = useState<Range>("3m");
  const [cardIndex, setCardIndex] = useState<number | null>(null);
  const [settledOverride, setSettledOverride] = useState<Record<string, boolean>>({});
  const stepsRef = useReveal<HTMLDivElement>([]);

  const applyOverride = useCallback(
    (a: Analytics): Analytics => {
      const dues = a.dues.map((d) => (d.id in settledOverride ? { ...d, settled: settledOverride[d.id] } : d));
      return {
        ...a,
        dues,
        byCard: a.byCard.map((c) => {
          const next = dues
            .filter((d) => d.card_id === c.card_id && !d.settled)
            .sort((x, y) => x.day.localeCompare(y.day))[0];
          return { ...c, next_due: next?.day ?? null, next_due_amount: next?.amount ?? null };
        }),
      };
    },
    [settledOverride]
  );

  const data = useMemo(() => applyOverride(demoAnalytics(range, cardIndex)), [range, cardIndex, applyOverride]);

  const cardStats = useMemo(() => {
    const map: Record<string, { debits: number; txns: number; nextDue: string | null; nextDueAmount: number | null }> = {};
    for (const row of applyOverride(demoAnalytics(range, null)).byCard) {
      map[row.card_id] = {
        debits: row.debits,
        txns: row.txns,
        nextDue: row.next_due,
        nextDueAmount: row.next_due_amount,
      };
    }
    return map;
  }, [range, applyOverride]);

  const activeId = cardIndex === null ? null : DEMO_CARDS[cardIndex].id;

  return (
    <div className="space-y-16">
      <section className="pt-4 text-center">
        <span className="rise inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface2 px-3 py-1 text-[11px] text-ink2 sm:text-xs">
          <Logo size={16} />
          <span className="sm:hidden">Only you can see your statements</span>
          <span className="hidden sm:inline">Invite only. Only you can see your statements.</span>
        </span>
        <h1
          className="rise mx-auto mt-4 max-w-3xl text-balance text-3xl font-semibold leading-tight tracking-tight sm:mt-5 sm:text-5xl"
          style={{ "--d": "60ms" } as React.CSSProperties}
        >
          Every card you hold, reconciled every month
        </h1>
        <p
          className="rise mx-auto mt-4 max-w-2xl text-balance text-sm text-ink2 sm:text-base"
          style={{ "--d": "120ms" } as React.CSSProperties}
        >
          Upload the statement your bank emails you. Outlay opens the password-protected PDF, checks the totals against
          the bank&apos;s own figures, and tracks spending and dues across every card.
        </p>
        <div
          className="rise mt-7 flex flex-wrap items-center justify-center gap-3"
          style={{ "--d": "180ms" } as React.CSSProperties}
        >
          <Link
            href="/register"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Create your account
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-line px-5 py-2.5 text-sm text-ink2 transition-colors hover:border-muted hover:text-ink"
          >
            Sign in
          </Link>
        </div>
        <p className="rise mt-3 text-xs text-muted" style={{ "--d": "240ms" } as React.CSSProperties}>
          Invite only.{" "}
          <a href={INVITE_MAILTO} className="text-accent underline underline-offset-2 hover:no-underline">
            Ask Ankit for a code
          </a>
          .
        </p>
      </section>

      <section>
        <div className="demo-frame">
          <div className="demo-ribbon">
            <span className="demo-dot" aria-hidden />
            <span className="min-w-0">
              Live demo running on invented cards and invented spend. Sign up and this same screen fills with your own
              statements.
            </span>
            <Link href="/register" className="ml-auto shrink-0 whitespace-nowrap text-accent hover:underline">
              Create your account
            </Link>
          </div>

          <div className="p-4 sm:p-6">
            <DashboardView
              title="Dashboard"
              demo
              cards={DEMO_CARDS}
              data={data}
              range={range}
              onRange={setRange}
              activeId={activeId}
              onSelectCard={(id) => setCardIndex(id === null ? null : DEMO_CARDS.findIndex((c) => c.id === id))}
              cardStats={cardStats}
              viewKey={`${range}-${cardIndex}`}
              stats={{
                rangeLabel: RANGE_LABELS[range],
                debits: Number(data.totals.debits),
                credits: Number(data.totals.credits),
                fees: Number(data.totals.fees),
                txns: Number(data.totals.txns),
              }}
              onSettle={(id, settled) => setSettledOverride((prev) => ({ ...prev, [id]: settled }))}
            />
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted">
          Nothing above is real except the software. Click a card, change the range, hover a day, settle a bill.
        </p>
      </section>

      <section ref={stepsRef} className="grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.n} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className="card p-6">
            <p className="text-xs font-medium tracking-[0.2em] text-accent">{s.n}</p>
            <h3 className="mt-2 text-base font-medium">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink2">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="card overflow-hidden p-8 text-center sm:p-14">
        <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Now imagine those were your numbers
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-ink2">
          The fees you did not notice. The subscription that renewed. The month you spent more than you thought. It is
          all already in the statements sitting in your inbox, waiting to be added up.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Start with your own statements
          </Link>
          <Link href="/login" className="text-sm text-accent hover:underline">
            I already have an account
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted">
          Statement files are read and thrown away, never saved. Your name, date of birth, card digits and statement
          passwords are locked with a key that belongs to your account and no one else&apos;s.
        </p>
      </section>
    </div>
  );
}
