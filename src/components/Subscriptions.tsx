"use client";

import { useState } from "react";
import { motion } from "motion/react";
import BankBadge from "./BankBadge";
import { inr } from "@/lib/format";
import type { Subscription } from "@/lib/subscriptions";

function shortDay(day: string) {
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

function dueIn(day: string, now: number) {
  const days = Math.round((Date.parse(`${day}T00:00:00`) - now) / 86_400_000);
  if (days < -1) return { text: `${-days}d late`, tone: "text-bad" };
  if (days <= 0) return { text: "due today", tone: "text-warn" };
  if (days <= 7) return { text: `in ${days}d`, tone: "text-warn" };
  return { text: `in ${days}d`, tone: "text-muted" };
}

/** One recurring charge, openable to show the charges behind it. */
function Row({ sub, delay, now }: { sub: Subscription; delay: number; now: number }) {
  const [open, setOpen] = useState(false);
  const next = dueIn(sub.nextDue, now);
  const history = [...sub.history].reverse();
  const first = sub.history[0]?.amount ?? sub.amount;
  const drift = first > 0 ? (sub.amount - first) / first : 0;

  return (
    <li className="rise sub-row" style={{ "--d": `${delay}ms` } as React.CSSProperties}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="sub-head"
      >
        <BankBadge bankId={sub.bankId} size={26} />
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[13px] text-ink">{sub.merchant}</span>
          <span className="block truncate text-[11px] text-muted">
            {sub.cardLabel} •••• {sub.last4 ?? "????"} · {sub.cadence} · {sub.charges} charges
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block tabular text-[13px] font-medium text-ink">{inr(sub.amount)}</span>
          <span className={`block text-[11px] ${next.tone}`}>{next.text}</span>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="overflow-hidden"
        >
          <div className="sub-body">
            <div className="sub-facts">
              <span>
                Since <span className="text-ink2">{shortDay(sub.firstSeen)}</span>
              </span>
              <span>
                Next <span className="text-ink2">{shortDay(sub.nextDue)}</span>
              </span>
              <span>
                <span className="text-ink2">{inr(sub.perYear)}</span> a year
              </span>
              {Math.abs(drift) >= 0.01 && (
                <span className={drift > 0 ? "text-warn" : "text-good"}>
                  {drift > 0 ? "up" : "down"} {Math.abs(Math.round(drift * 100))}% since the first charge
                </span>
              )}
            </div>
            <ul className="sub-charges">
              {history.map((h, i) => (
                <li key={`${h.date}-${i}`}>
                  <span className="sub-tick" aria-hidden />
                  <span className="tabular text-ink2">{shortDay(h.date)}</span>
                  <span className="min-w-0 flex-1 truncate text-muted">{h.description}</span>
                  <span className="tabular text-ink">{inr(h.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </li>
  );
}

export default function Subscriptions({ subs }: { subs: Subscription[] }) {
  const [all, setAll] = useState(false);
  // Read once, so every row dates itself against the same moment.
  const [now] = useState(() => Date.now());

  if (subs.length === 0)
    return (
      <div className="card rise min-w-0 p-5" style={{ "--d": "300ms" } as React.CSSProperties}>
        <h2 className="text-sm font-medium text-ink2">Recurring</h2>
        <div className="sub-empty">
          <span className="sub-empty-icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 11a8 8 0 0 0-13.7-5.6L4 7.6M4 13a8 8 0 0 0 13.7 5.6L20 16.4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M4 4v3.6h3.6M20 20v-3.6h-3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="sub-empty-title">Nothing charging on repeat</p>
          <p className="sub-empty-sub">
            A charge counts once the same merchant bills the same card, for about the same amount, three cycles running.
            Upload a few more statements and anything regular will surface here.
          </p>
        </div>
      </div>
    );

  const monthly = subs.reduce((a, s) => a + s.perYear / 12, 0);
  const shown = all ? subs : subs.slice(0, 5);
  const soon = subs.filter((s) => Date.parse(`${s.nextDue}T00:00:00`) - now < 7 * 86_400_000).length;

  return (
    <div className="card rise min-w-0 p-5" style={{ "--d": "300ms" } as React.CSSProperties}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-ink2">Recurring</h2>
          <p className="mt-0.5 text-xl font-semibold tabular tracking-tight">{inr(monthly)}</p>
          <p className="text-[11px] text-muted">
            a month across {subs.length} subscription{subs.length === 1 ? "" : "s"} · {inr(monthly * 12)} a year
            {soon > 0 && <span className="text-warn"> · {soon} due within a week</span>}
          </p>
        </div>
        {subs.length > 5 && (
          <button
            onClick={() => setAll((v) => !v)}
            className="shrink-0 rounded-md border border-line px-2 py-1 text-[11px] text-ink2 transition-colors hover:border-muted hover:text-ink"
          >
            {all ? "Top 5" : `All ${subs.length}`}
          </button>
        )}
      </div>

      <ul className="mt-3.5 space-y-1.5">
        {shown.map((s, i) => (
          <Row key={s.key} sub={s} delay={Math.min(i, 8) * 40} now={now} />
        ))}
      </ul>

      <p className="mt-3 text-[11px] text-muted">
        Same merchant, same amount, same card, on a steady cycle. Open a row for the charges behind it.
      </p>
    </div>
  );
}
