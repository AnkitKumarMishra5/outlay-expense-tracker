"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { play } from "@/lib/sound";

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState({ left: 0, top: 0, width: 0, height: 0, ready: false });

  const measure = useCallback(() => {
    const el = wrapRef.current?.querySelector<HTMLButtonElement>(`[data-val="${value}"]`);
    if (el) setInd({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight, ready: true });
  }, [value]);

  useLayoutEffect(measure, [measure, options]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <div ref={wrapRef} className="relative flex flex-wrap gap-1 rounded-lg bg-surface p-1">
      {ind.ready && (
        <span
          aria-hidden
          className="absolute rounded-md bg-accent transition-all duration-300"
          style={{ left: ind.left, top: ind.top, width: ind.width, height: ind.height, transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          data-val={o.value}
          onClick={() => {
            if (o.value !== value) play("tick");
            onChange(o.value);
          }}
          className={`relative z-10 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value === o.value ? "text-white" : "text-ink2 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
