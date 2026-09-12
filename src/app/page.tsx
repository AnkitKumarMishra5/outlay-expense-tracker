"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { setCardholder } from "@/lib/cardholder";
import { SAMPLE_IDENTITY } from "@/lib/passwords";
import DashboardView from "@/components/DashboardView";
import FindingIllustrations from "@/components/FindingIllustrations";
import { INVITE_MAILTO } from "@/lib/developer";
import { DEMO_CARDS } from "@/lib/demo";
import { demoAnalytics, DEMO_MONTHS } from "@/lib/demoAnalytics";
import { monthTitle } from "@/lib/format";
import { useReveal } from "@/lib/useReveal";
import { useSignedIn } from "@/lib/signedIn";
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

setCardholder(SAMPLE_IDENTITY.name);

export default function Landing() {
  // Someone already signed in does not need to be asked to sign in again.
  const signedIn = useSignedIn();
  const [month, setMonth] = useState<string | null>(() => DEMO_MONTHS[0] ?? null);
  const [cardIndex, setCardIndex] = useState<number | null>(null);
  const [settledOverride, setSettledOverride] = useState<Record<string, boolean>>({});
  const stepsRef = useReveal<HTMLDivElement>([]);

  const applyOverride = useCallback(
    <T extends Analytics>(a: T): T => {
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

  const data = useMemo(
    () => applyOverride(demoAnalytics("all", cardIndex, month)),
    [cardIndex, month, applyOverride]
  );

  const cardStats = useMemo(() => {
    const map: Record<string, { debits: number; txns: number; nextDue: string | null; nextDueAmount: number | null }> = {};
    for (const row of applyOverride(demoAnalytics("all", null, month)).byCard) {
      map[row.card_id] = {
        debits: row.debits,
        txns: row.txns,
        nextDue: row.next_due,
        nextDueAmount: row.next_due_amount,
      };
    }
    return map;
  }, [month, applyOverride]);

  const activeId = cardIndex === null ? null : DEMO_CARDS[cardIndex].id;

  return (
    <div className="space-y-16">
      <section className="pt-4 text-center">
        <h1
          className="rise mx-auto max-w-3xl text-balance text-3xl font-semibold leading-tight tracking-tight sm:mt-5 sm:text-5xl"
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
          {signedIn ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Go to your dashboard
            </Link>
          ) : (
            <>
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
            </>
          )}
        </div>
        <p className="rise mt-3 text-xs text-muted" style={{ "--d": "240ms" } as React.CSSProperties}>
          {signedIn ? (
            "You are signed in. Everything below is the demo, not your data."
          ) : (
            <>
              Invite only, and only you can see your statements.{" "}
              <a href={INVITE_MAILTO} className="text-accent underline underline-offset-2 hover:no-underline">
                Ask Ankit for a code
              </a>
              .
            </>
          )}
        </p>
      </section>

      {/* Someone signed in has their own figures a click away; a demo of
          invented ones is noise at that point. */}
      {!signedIn && (
        <section>
          <div className="demo-frame">
            <div className="demo-ribbon">
              <span className="demo-dot" aria-hidden />
              <span className="min-w-0">
                Live demo running on invented cards and invented spend. Sign up and this same screen fills with your own
                statements.
              </span>
              <Link
                href={signedIn ? "/dashboard" : "/register"}
                className="ml-auto shrink-0 whitespace-nowrap text-accent hover:underline"
              >
                {signedIn ? "Open your dashboard" : "Create your account"}
              </Link>
            </div>

            <div className="p-4 sm:p-6">
              <DashboardView
                title="Dashboard"
                demo
                cards={DEMO_CARDS}
                data={data}
                timeline={data}
                month={month}
                months={DEMO_MONTHS}
                onMonth={setMonth}
                activeId={activeId}
                onSelectCard={(id) => setCardIndex(id === null ? null : DEMO_CARDS.findIndex((c) => c.id === id))}
                cardStats={cardStats}
                viewKey={`${month}-${cardIndex}`}
                stats={{
                  rangeLabel: month ? monthTitle(month) : "All time",
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
      )}

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
          It is all already in the statements sitting in your inbox, waiting to be added up.
        </p>

        <FindingIllustrations />

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {signedIn ? (
            <Link
              href="/upload"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Upload a statement
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Start with your own statements
              </Link>
              <Link href="/login" className="text-sm text-accent hover:underline">
                I already have an account
              </Link>
            </>
          )}
        </div>
        <p className="mt-6 text-xs text-muted">
          Statement files are read and thrown away, never saved. Your name, date of birth, card digits and statement
          passwords are locked with a key that belongs to your account and no one else&apos;s.
        </p>
      </section>
    </div>
  );
}
