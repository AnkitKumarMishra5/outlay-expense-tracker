"use client";

import { Check } from "@/lib/types";

const R = 26;
const CIRC = 2 * Math.PI * R;

export default function CheckSummary({ checks }: { checks: Check[] }) {
  const pass = checks.filter((c) => c.status === "pass").length;
  const warn = checks.filter((c) => c.status === "warn").length;
  const fail = checks.filter((c) => c.status === "fail").length;
  const total = Math.max(1, checks.length);

  const segments = [
    { n: pass, cls: "text-good" },
    { n: warn, cls: "text-warn" },
    { n: fail, cls: "text-bad" },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const len = (seg.n / total) * CIRC;
    const arc = { ...seg, dash: `${Math.max(0, len - 2)} ${CIRC}`, rotate: (offset / CIRC) * 360 };
    offset += len;
    return arc;
  });

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[68px] w-[68px] shrink-0">
        <svg viewBox="0 0 68 68" className="h-full w-full -rotate-90">
          <circle cx="34" cy="34" r={R} fill="none" stroke="currentColor" strokeWidth="6" className="text-surface2" />
          {arcs.map((a, i) =>
            a.n > 0 ? (
              <circle
                key={i}
                cx="34"
                cy="34"
                r={R}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={a.dash}
                className={`ring-draw ${a.cls}`}
                style={{
                  transform: `rotate(${a.rotate}deg)`,
                  transformOrigin: "34px 34px",
                  animationDelay: `${i * 120}ms`,
                  ["--circ" as string]: `${CIRC}`,
                }}
              />
            ) : null
          )}
        </svg>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-semibold tabular">
          {pass}/{checks.length}
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-x-5 gap-y-0.5 text-sm">
        <dt className="text-good">Passed</dt>
        <dt className="text-warn">Warnings</dt>
        <dt className="text-bad">Failed</dt>
        <dd className="text-lg font-semibold tabular">{pass}</dd>
        <dd className="text-lg font-semibold tabular">{warn}</dd>
        <dd className="text-lg font-semibold tabular">{fail}</dd>
      </dl>
    </div>
  );
}
