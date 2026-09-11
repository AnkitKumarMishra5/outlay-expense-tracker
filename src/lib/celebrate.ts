"use client";

/** A moment worth a flourish: a card balance cleared. */
export interface Celebration {
  id: number;
  kind: "settled";
  card?: { bankId: string; label: string; last4?: string | null };
  amount?: number | null;
  detail?: string;
}

const listeners = new Set<(c: Celebration) => void>();
let seq = 0;

export function celebrate(c: Omit<Celebration, "id">) {
  const full = { ...c, id: ++seq };
  listeners.forEach((l) => l(full));
}

export function subscribeCelebrations(l: (c: Celebration) => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
