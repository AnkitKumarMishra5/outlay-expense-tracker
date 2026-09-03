"use client";

import { bankById } from "@/lib/banks";
import { inr } from "@/lib/format";
import CountUp from "./CountUp";
import type { RangeStats } from "./CardRail";

export default function CardBack({
  bankId,
  label,
  last4,
  stats,
}: {
  bankId: string;
  label: string;
  last4?: string | null;
  stats?: RangeStats | null;
}) {
  const bank = bankById(bankId);
  const deep = bank.c3 ?? bank.color;

  return (
    <div
      className="cc flex h-full flex-col"
      style={{
        background: [
          `radial-gradient(110% 80% at 88% 6%, color-mix(in srgb, ${bank.c2} 26%, transparent) 0%, transparent 60%)`,
          `linear-gradient(150deg, color-mix(in srgb, ${deep} 88%, #000) 0%, color-mix(in srgb, ${bank.color} 52%, #000) 100%)`,
        ].join(", "),
      }}
    >
      <div className="cc-stripe" aria-hidden />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
            {label}
          </span>
          <span className="shrink-0 font-mono text-[10px] tracking-wider text-white/55">
            •••• {last4 ?? "????"}
          </span>
        </div>

        {stats ? (
          <>
            <div className="mt-1.5 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.16em] text-white/45">Spend</p>
                <p className="cc-figure truncate text-[21px] font-semibold leading-none tracking-tight text-white">
                  <CountUp value={stats.debits} format={inr} />
                </p>
              </div>
              <p className="shrink-0 text-right text-[10px] leading-tight text-white/55">
                {stats.rangeLabel}
                <br />
                <span className="tabular text-white/80">{stats.txns} txns</span>
              </p>
            </div>

            <p className="mt-auto flex items-baseline gap-2 pt-2 text-[10px] leading-none text-white/55">
              <span>
                Paid <span className="tabular text-white/85">{inr(stats.credits)}</span>
              </span>
              <span className="text-white/25">|</span>
              <span>
                Fees{" "}
                <span className={`tabular ${stats.fees > 0 ? "text-warn" : "text-white/85"}`}>{inr(stats.fees)}</span>
              </span>
            </p>
          </>
        ) : (
          <div className="mt-3 flex flex-1 items-center">
            <p className="text-[11px] text-white/45">Loading period figures…</p>
          </div>
        )}
      </div>
    </div>
  );
}
