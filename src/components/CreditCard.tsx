"use client";

import { useRef } from "react";
import { bankById } from "@/lib/banks";

export default function CreditCard({
  bankId,
  label,
  last4,
  size = "md",
  tilt = false,
  className = "",
}: {
  bankId: string;
  label: string;
  last4?: string | null;
  size?: "sm" | "md";
  tilt?: boolean;
  className?: string;
}) {
  const bank = bankById(bankId);
  const ref = useRef<HTMLDivElement>(null);
  const fg = bank.fg ?? "#ffffff";
  const sub = bank.fg ? "rgba(26,26,25,0.65)" : "rgba(255,255,255,0.72)";
  const deep = bank.c3 ?? bank.color;
  const mesh = [
    `radial-gradient(120% 90% at 12% 4%, color-mix(in srgb, ${bank.c2} 62%, transparent) 0%, transparent 58%)`,
    `radial-gradient(105% 80% at 92% 96%, color-mix(in srgb, ${bank.c2} 40%, transparent) 0%, transparent 62%)`,
    `radial-gradient(80% 70% at 78% 8%, rgba(255,255,255,0.14) 0%, transparent 55%)`,
    `linear-gradient(147deg, ${deep} 0%, ${bank.color} 52%, color-mix(in srgb, ${bank.c2} 78%, ${bank.color}) 100%)`,
  ].join(", ");

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || !tilt || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (size === "sm") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(px * 10).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-py * 10).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(px * 100 + 50).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(py * 100 + 50).toFixed(1)}%`);
    el.style.setProperty("--tiltx", `${(px * 26).toFixed(1)}`);
  }

  function onLeave() {
    const el = ref.current;
    el?.style.setProperty("--rx", "0deg");
    el?.style.setProperty("--ry", "0deg");
  }

  const contactless = (s: number) => (
    <svg width={s} height={s} viewBox="0 0 18 18" fill="none" aria-hidden>
      {[3, 6.5, 10].map((r) => (
        <path key={r} d={`M ${6 - r * 0.2} ${9 - r} A ${r} ${r} 0 0 1 ${6 - r * 0.2} ${9 + r}`} stroke={sub} strokeWidth="1.4" strokeLinecap="round" transform="rotate(180 9 9)" />
      ))}
    </svg>
  );

  const chipContacts = (
    <svg viewBox="0 0 38 29" className="absolute inset-0 h-full w-full" aria-hidden>
      <path
        d="M13 0v8.5c0 1.7-1.3 3-3 3H0M25 0v8.5c0 1.7 1.3 3 3 3h10M13 29v-8.5c0-1.7-1.3-3-3-3H0M25 29v-8.5c0-1.7 1.3-3 3-3h10M13 14.5h12"
        stroke="rgba(70,48,12,0.5)"
        strokeWidth="1.1"
        fill="none"
      />
      <rect x="14" y="9" width="10" height="11" rx="2.5" fill="none" stroke="rgba(70,48,12,0.5)" strokeWidth="1.1" />
    </svg>
  );

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`cc ${tilt ? "tilt" : ""} flex flex-col ${size === "sm" ? "p-3" : "p-4"} ${className}`}
      style={{ background: mesh, color: fg }}
    >
      {size === "md" ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <span className="cc-issuer min-w-0 truncate text-[13px] font-bold uppercase tracking-[0.16em]">
              {bank.name}
            </span>
            {contactless(18)}
          </div>
          <div className="mt-auto">
            <span className="cc-chip">{chipContacts}</span>
            <p className="cc-pan emboss mt-[3.5%] font-mono font-semibold tracking-[0.14em]">
              <span style={{ opacity: 0.62 }}>••••&nbsp;••••&nbsp;••••</span>
              <span className="cc-last4">&nbsp;{last4 ?? "0000"}</span>
            </p>
            <p className="cc-label emboss mt-2.5 min-w-0 truncate text-[12px] font-bold uppercase tracking-[0.13em]">
              {label}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <span className="cc-issuer min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.13em]">
              {bank.name}
            </span>
            {contactless(14)}
          </div>
          <div className="mt-auto flex items-end justify-between gap-2">
            <div className="min-w-0">
              <span className="cc-chip mb-1.5">{chipContacts}</span>
              <p className="cc-label emboss truncate text-[12px] font-bold uppercase tracking-[0.08em] leading-tight">
                {label}
              </p>
            </div>
            <span className="cc-last4 shrink-0 font-mono text-[12px] font-semibold tabular">
              {last4 ? `•••• ${last4}` : "••••"}
            </span>
          </div>
        </>
      )}
      <span className="cc-brushed" aria-hidden />
      <span className="cc-guilloche" aria-hidden />
      <span className="cc-specular" aria-hidden />
      <span className="cc-grain" aria-hidden />
      <span className="cc-sheen" />
      {tilt && <span className="cc-glare-spot" />}
    </div>
  );
}
