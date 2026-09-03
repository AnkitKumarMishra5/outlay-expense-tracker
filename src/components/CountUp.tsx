"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function canAnimate() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !document.hidden;
}

export default function CountUp({
  value,
  format,
  duration = 650,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const animate = useSyncExternalStore(subscribe, canAnimate, () => false);
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!animate) return;
    const from = fromRef.current;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration, animate]);

  return <span>{format(animate ? display : value)}</span>;
}
