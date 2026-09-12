"use client";

import { useEffect, useRef, useState } from "react";
import { monthKey, monthTitle, shiftMonth } from "@/lib/format";

/** The dashboard's month control. */
export default function MonthPicker({
  value,
  months,
  onChange,
}: {
  /** The month on screen, or null for all time. */
  value: string | null;
  /** Months that hold data, newest first. */
  months: string[];
  onChange: (month: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const here = value ?? monthKey();
  const known = new Set(months);
  const earliest = months[months.length - 1];
  const canBack = Boolean(value) && months.some((m) => m < here);
  const canForward = Boolean(value) && months.some((m) => m > here);

  const step = (by: number) => {
    if (!value) return;
    const pool = by < 0 ? months.filter((m) => m < here) : months.filter((m) => m > here);
    const next = by < 0 ? pool[0] : pool[pool.length - 1];
    if (next) {
      onChange(next);
    }
  };

  return (
    <div ref={wrap} className="month-picker">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={!canBack}
        aria-label={value ? `Show ${monthTitle(shiftMonth(here, -1))}` : "Earlier month"}
        className="month-step"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M14.5 5.5 8 12l6.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="month-face"
      >
        <span className="truncate">{value ? monthTitle(value) : "All time"}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className={open ? "rotate-180" : ""}>
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => step(1)}
        disabled={!canForward}
        aria-label={value ? `Show ${monthTitle(shiftMonth(here, 1))}` : "Later month"}
        className="month-step"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9.5 5.5 16 12l-6.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="month-menu" role="listbox" aria-label="Choose a month">
          <button
            type="button"
            role="option"
            aria-selected={value === null}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={`month-option ${value === null ? "is-on" : ""}`}
          >
            All time
          </button>
          <div className="month-menu-rule" aria-hidden />
          {months.map((m) => (
            <button
              key={m}
              type="button"
              role="option"
              aria-selected={m === value}
              onClick={() => {
                onChange(m);
                setOpen(false);
              }}
              className={`month-option ${m === value ? "is-on" : ""}`}
            >
              {monthTitle(m)}
            </button>
          ))}
          {months.length === 0 && <p className="px-3 py-2 text-xs text-muted">Nothing uploaded yet.</p>}
          {earliest && !known.has(here) && value && (
            <p className="px-3 pb-2 pt-1 text-[11px] text-muted">Nothing recorded in {monthTitle(here)}.</p>
          )}
        </div>
      )}
    </div>
  );
}
