"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function RouteProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const start = setTimeout(() => {
      setVisible(true);
      setWidth(18);
    }, 0);
    const a = setTimeout(() => setWidth(62), 90);
    const b = setTimeout(() => setWidth(88), 260);
    const c = setTimeout(() => setWidth(100), 420);
    const d = setTimeout(() => setVisible(false), 620);
    const e = setTimeout(() => setWidth(0), 900);
    return () => [start, a, b, c, d, e].forEach(clearTimeout);
  }, [pathname]);

  return <div className="route-progress" style={{ width: `${width}%`, opacity: visible ? 1 : 0 }} aria-hidden />;
}
