"use client";

import { useMemo, useState } from "react";
import { useToast } from "./Toasts";
import { createPortal } from "react-dom";
import { inr } from "@/lib/format";
import { useChartTokens } from "@/lib/chartTokens";
import { bankById } from "@/lib/banks";

export interface DaySpend {
  day: string;
  debits: number;
  txns: number;
}

export interface DayCard {
  day: string;
  cardId: string;
  cardLabel: string;
  bankId: string;
  last4: string | null;
  debits: number;
  txns: number;
}

export interface DueDate {
  id: string;
  day: string;
  amount: number | null;
  minDue: number | null;
  settled: boolean;
  cardLabel: string;
  bankId: string;
  last4: string | null;
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const LEVELS = [0, 0.25, 0.5, 0.75, 1];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

function longDate(key: string) {
  return new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SpendCalendar({
  data,
  dayCards,
  dues,
  onSettle,
}: {
  data: DaySpend[];
  dayCards: DayCard[];
  dues: DueDate[];
  onSettle?: (id: string, settled: boolean) => Promise<void> | void;
}) {
  const t = useChartTokens();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<{ key: string; x: number; y: number; below: boolean } | null>(null);
  const today = todayKey();

  const byDay = useMemo(() => new Map(data.map((d) => [d.day, d])), [data]);

  const cardsByDay = useMemo(() => {
    const map = new Map<string, DayCard[]>();
    dayCards.forEach((d) => {
      const list = map.get(d.day) ?? [];
      list.push(d);
      map.set(d.day, list);
    });
    return map;
  }, [dayCards]);

  const duesByDay = useMemo(() => {
    const map = new Map<string, DueDate[]>();
    dues.forEach((d) => {
      const list = map.get(d.day) ?? [];
      list.push(d);
      map.set(d.day, list);
    });
    return map;
  }, [dues]);

  const months = useMemo(() => {
    const set = new Set<string>([
      monthKey(new Date()),
      ...data.map((d) => d.day.slice(0, 7)),
      ...dues.map((d) => d.day.slice(0, 7)),
    ]);
    return [...set].filter(Boolean).sort();
  }, [data, dues]);

  const defaultMonth = useMemo(() => {
    const current = monthKey(new Date());
    const currentHasSpend = data.some((d) => d.debits > 0 && d.day.startsWith(current));
    const currentHasBills = dues.some((d) => d.day.startsWith(current));
    if (currentHasSpend || currentHasBills) return current;
    const spent = data.filter((d) => d.debits > 0).map((d) => d.day.slice(0, 7)).sort();
    if (spent.length) return spent[spent.length - 1];
    return current;
  }, [data, dues]);

  const [picked, setPicked] = useState<string | null>(null);
  const month = picked && months.includes(picked) ? picked : defaultMonth;
  const index = months.indexOf(month);
  const [y, m] = month.split("-").map(Number);

  const max = Math.max(...data.map((d) => d.debits), 1);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const leading = (first.getDay() + 6) % 7;
  const label = first.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const cells = Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);

  const monthSpend = cells.reduce((a, k) => a + (byDay.get(k)?.debits ?? 0), 0);
  const monthDue = cells.reduce(
    (a, k) => a + (duesByDay.get(k) ?? []).filter((d) => !d.settled).reduce((b, d) => b + (d.amount ?? 0), 0),
    0
  );

  const busiest = cells.reduce<{ key: string; v: number } | null>((best, k) => {
    const v = byDay.get(k)?.debits ?? 0;
    return v > (best?.v ?? 0) ? { key: k, v } : best;
  }, null);
  const activeDays = cells.filter((k) => (byDay.get(k)?.debits ?? 0) > 0).length;

  const detailKey = selected && selected.startsWith(month) ? selected : null;
  const tipKey = hover?.key ?? null;

  function place(key: string, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const half = 158;
    const x = Math.min(Math.max(r.left + r.width / 2, half + 10), window.innerWidth - half - 10);
    const below = r.top < 250;
    return { key, x, y: below ? r.bottom : r.top, below };
  }

  function dayBlocks(key: string) {
    const spendCards = cardsByDay.get(key) ?? [];
    const dueList = duesByDay.get(key) ?? [];
    const spend = byDay.get(key)?.debits ?? 0;
    const txns = byDay.get(key)?.txns ?? 0;
    const dueTotal = dueList.reduce((a, d) => a + (d.amount ?? 0), 0);
    const minTotal = dueList.reduce((a, d) => a + (d.minDue ?? 0), 0);
    const away = daysBetween(today, key);
    return { spendCards, dueList, spend, txns, dueTotal, minTotal, away };
  }

  function tipContent(key: string) {
    const { spendCards, dueList, spend, txns, dueTotal, minTotal, away } = dayBlocks(key);
    return (
      <div>
        <p className="cal-tip-date">{longDate(key)}</p>

        {spend > 0 ? (
          <>
            <p className="cal-tip-total">
              {inr(spend)}{" "}
              <span className="cal-tip-sub">
                spent over {txns} transaction{txns === 1 ? "" : "s"}
              </span>
            </p>
            <ul className="cal-tip-list">
              {spendCards.map((c) => (
                <li key={c.cardId}>
                  <span className="cal-tip-dot" style={{ background: bankById(c.bankId).color }} />
                  <span className="cal-tip-name">
                    {c.cardLabel} <span className="cal-tip-sub">•••• {c.last4 ?? "????"}</span>
                  </span>
                  <span className="cal-tip-amt">{inr(c.debits)}</span>
                  <span className="cal-tip-sub">
                    {c.txns} txn{c.txns === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="cal-tip-none">No spend on this day</p>
        )}

        {dueList.length > 0 && (
          <div className="cal-tip-due">
            <p className={`cal-tip-duehead ${dueList.every((d) => d.settled) ? "cal-tip-settled" : ""}`}>
              <span className="cal-tip-duedot" />
              {dueList.filter((d) => !d.settled).length === 0
                ? `${dueList.length} bill${dueList.length === 1 ? "" : "s"}, all settled`
                : `${dueList.filter((d) => !d.settled).length} of ${dueList.length} still to pay`}
              <span className="cal-tip-sub">
                {away > 0 ? ` \u00b7 in ${away} day${away === 1 ? "" : "s"}` : away === 0 ? " \u00b7 today" : " \u00b7 already passed"}
              </span>
            </p>
            <p className="cal-tip-total">
              {inr(dueTotal)} <span className="cal-tip-sub">total{minTotal > 0 ? ` \u00b7 min ${inr(minTotal)}` : ""}</span>
            </p>
            {[false, true].map((group) => {
              const rows = dueList.filter((d) => d.settled === group);
              if (rows.length === 0) return null;
              return (
                <div key={String(group)}>
                  <p className="cal-tip-group">{group ? "Settled" : "To settle"}</p>
                  <ul className="cal-tip-list">
                    {rows.map((d, i) => (
                      <li key={`${d.id}-${i}`} className={group ? "cal-tip-done" : ""}>
                        <span className="cal-tip-dot" style={{ background: bankById(d.bankId).color }} />
                        <span className="cal-tip-name">
                          {group ? "\u2713 " : ""}
                          {d.cardLabel} <span className="cal-tip-sub">•••• {d.last4 ?? "????"}</span>
                        </span>
                        <span className="cal-tip-amt">{d.amount != null ? inr(d.amount) : "\u2014"}</span>
                        <span className="cal-tip-sub">
                          {d.settled ? "settled" : `min ${d.minDue != null ? inr(d.minDue) : "\u2014"}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {away >= 0 && <p className="cal-tip-foot">Pay the total due, not the minimum.</p>}
          </div>
        )}
      </div>
    );
  }

  const detail = detailKey ? dayBlocks(detailKey) : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setPicked(months[Math.max(0, index - 1)]);
            setSelected(null);
          }}
          disabled={index <= 0}
          aria-label="Previous month"
          className="rounded-md border border-line px-2 py-1 text-xs text-ink2 hover:border-muted disabled:opacity-30"
        >
          ‹
        </button>
        <span className="text-sm font-medium">{label}</span>
        <button
          onClick={() => {
            setPicked(months[Math.min(months.length - 1, index + 1)]);
            setSelected(null);
          }}
          disabled={index >= months.length - 1}
          aria-label="Next month"
          className="rounded-md border border-line px-2 py-1 text-xs text-ink2 hover:border-muted disabled:opacity-30"
        >
          ›
        </button>
        <span className="ml-auto text-sm tabular text-ink2">{inr(monthSpend)}</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="pb-1 text-[10px] uppercase tracking-wider text-muted">
            {d}
          </span>
        ))}
        {Array.from({ length: leading }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {cells.map((key, i) => {
          const spend = byDay.get(key)?.debits ?? 0;
          const lv = spend > 0 ? Math.min(4, Math.ceil((spend / max) * 4)) : 0;
          const dueList = duesByDay.get(key) ?? [];
          const upcoming = key >= today;
          const isToday = key === today;
          const isSelected = detailKey === key;
          return (
            <button
              key={key}
              onMouseEnter={(e) => setHover(place(key, e.currentTarget))}
              onMouseLeave={() => setHover(null)}
              onFocus={(e) => setHover(place(key, e.currentTarget))}
              onBlur={() => setHover(null)}
              onClick={() => setSelected(isSelected ? null : key)}
              aria-label={`${longDate(key)}${spend > 0 ? `, ${inr(spend)} spent` : ""}${
                dueList.length ? `, ${dueList.length} payment due` : ""
              }`}
              className={`cal-cell relative flex aspect-square items-center justify-center rounded-md border text-[11px] tabular ${
                isSelected ? "border-accent" : isToday ? "border-muted" : "border-line"
              } ${lv ? "text-white" : "text-muted"}`}
              style={{
                background: lv ? `color-mix(in srgb, ${t.series[0]} ${LEVELS[lv] * 100}%, transparent)` : "transparent",
              }}
            >
              {i + 1}
              {dueList.length > 0 &&
                (() => {
                  const open = dueList.filter((x) => !x.settled);
                  const allSettled = open.length === 0;
                  return (
                    <span
                      className={`cal-due-count ${allSettled ? "cal-due-settled" : upcoming ? "cal-due-live" : ""}`}
                      aria-hidden
                    >
                      {allSettled ? "✓" : open.length}
                    </span>
                  );
                })()}
            </button>
          );
        })}
      </div>

      {tipKey &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={`cal-tip ${hover!.below ? "cal-tip-below" : ""}`}
            style={{ left: `${hover!.x}px`, top: `${hover!.y}px` }}
            role="tooltip"
          >
            {tipContent(tipKey)}
          </div>,
          document.body
        )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-muted">
        <span className="flex items-center gap-1.5">
          Less
          {LEVELS.map((l, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-sm border border-line"
              style={{ background: l ? `color-mix(in srgb, ${t.series[0]} ${l * 100}%, transparent)` : "transparent" }}
            />
          ))}
          More
        </span>
        <span className="flex items-center gap-1.5">
          <span className="cal-legend-chip cal-due-count" aria-hidden>1</span>
          Bills due
          <span className="cal-legend-chip cal-due-count cal-due-settled ml-2" aria-hidden>✓</span>
          all settled
        </span>
        <span className="ml-auto hidden sm:inline">Hover a day for the breakdown, click to pin it</span>
        <span className="ml-auto sm:hidden">Tap a day for the breakdown</span>
      </div>

      {detailKey && detail && (
        <div className="rise mt-3 rounded-lg border border-line bg-surface2 p-3 text-sm">
          <p className="font-medium">{longDate(detailKey)}</p>
          {detail.spendCards.length === 0 && detail.dueList.length === 0 && (
            <p className="mt-1 text-xs text-muted">Nothing recorded on this day.</p>
          )}
          {detail.spendCards.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs">
              {detail.spendCards.map((c) => (
                <li key={c.cardId} className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: bankById(c.bankId).color }} />
                  <span className="truncate">
                    {c.cardLabel} <span className="text-muted">•••• {c.last4 ?? "????"}</span>
                  </span>
                  <span className="ml-auto tabular">{inr(c.debits)}</span>
                </li>
              ))}
            </ul>
          )}
          {detail.dueList.length > 0 && (
            <>
              <p className="mt-3 border-t border-line pt-2 text-xs font-medium">
                <span className={detail.dueList.some((d) => !d.settled) ? "text-warn" : "text-good"}>
                  {detail.dueList.filter((d) => d.settled).length} of {detail.dueList.length} bill
                  {detail.dueList.length === 1 ? "" : "s"} settled
                </span>
                <span className="tabular text-ink2"> · {inr(detail.dueTotal)}</span>
              </p>
              <ul className="mt-1.5 space-y-1 text-xs">
                {detail.dueList.map((d, i) => (
                  <li key={`${d.id}-${i}`} className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${d.settled ? "bg-good" : "bg-warn"}`}
                      aria-hidden
                    />
                    <span className="truncate">
                      {d.cardLabel} <span className="text-muted">•••• {d.last4 ?? "????"}</span>
                    </span>
                    <span className="ml-auto tabular">{d.amount != null ? inr(d.amount) : "\u2014"}</span>
                    <span className={`w-20 text-right tabular ${d.settled ? "text-good" : "text-muted"}`}>
                      {d.settled ? "settled" : `min ${d.minDue != null ? inr(d.minDue) : "\u2014"}`}
                    </span>
                    {onSettle && Number(d.amount ?? 0) > 0 && (
                      <button
                        onClick={async () => {
                          setBusy(d.id);
                          const next = !d.settled;
                          await onSettle(d.id, next);
                          setBusy(null);
                          toast.push(
                            next ? `${d.cardLabel} marked as settled` : `${d.cardLabel} marked as not settled`,
                            { detail: `Due ${d.day}`, tone: next ? "good" : "info" }
                          );
                        }}
                        disabled={busy === d.id}
                        className={`shrink-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10.5px] transition-colors disabled:opacity-40 ${
                          d.settled
                            ? "border-line text-muted hover:border-muted hover:text-ink"
                            : "border-accent/50 text-accent hover:bg-accent/10"
                        }`}
                      >
                        {busy === d.id ? "..." : d.settled ? "Mark as unsettled" : "Mark as settled"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface2 p-3">
          <p className="text-muted">Busiest day</p>
          <p className="mt-0.5 tabular">{busiest ? `${Number(busiest.key.slice(-2))} · ${inr(busiest.v)}` : "n/a"}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface2 p-3">
          <p className="text-muted">Days with spend</p>
          <p className="mt-0.5 tabular">{activeDays}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface2 p-3">
          <p className="text-muted">Still to pay this month</p>
          <p className="mt-0.5 tabular">{monthDue > 0 ? inr(monthDue) : "all settled"}</p>
        </div>
      </div>
    </div>
  );
}
