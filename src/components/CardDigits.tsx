"use client";

import { useState } from "react";

export default function CardDigits({
  cardId,
  last4,
  first4,
  onSaved,
}: {
  cardId: string;
  last4: string | null;
  first4: string | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [l4, setL4] = useState(last4 ?? "");
  const [f4, setF4] = useState(first4 ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const field =
    "w-[74px] rounded-md border border-line bg-surface px-2 py-1 text-xs tabular outline-none focus:border-accent";

  async function save() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ last4: l4 || null, first4: f4 || null }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save.");
      return;
    }
    setOpen(false);
    onSaved();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-accent hover:underline">
        {last4 || first4 ? "Edit digits" : "Add digits"}
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <input
        value={f4}
        onChange={(e) => setF4(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="first 4"
        inputMode="numeric"
        aria-label="First 4 digits"
        className={field}
      />
      <input
        value={l4}
        onChange={(e) => setL4(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="last 4"
        inputMode="numeric"
        aria-label="Last 4 digits"
        className={field}
      />
      <button
        onClick={save}
        disabled={busy}
        className="rounded-md bg-accent px-2 py-1 text-[11px] text-white disabled:opacity-40"
      >
        Save
      </button>
      <button
        onClick={() => {
          setOpen(false);
          setL4(last4 ?? "");
          setF4(first4 ?? "");
          setError("");
        }}
        className="rounded-md border border-line px-2 py-1 text-[11px] text-ink2"
      >
        Cancel
      </button>
      {error && <span className="w-full text-[11px] text-bad">{error}</span>}
    </span>
  );
}
