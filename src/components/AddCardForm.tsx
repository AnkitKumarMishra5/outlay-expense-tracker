"use client";

import { useState } from "react";
import { BANKS } from "@/lib/banks";
import BankBadge from "./BankBadge";

export default function AddCardForm({ onAdded }: { onAdded: () => void }) {
  const [bankId, setBankId] = useState<string | null>(null);
  const [cardLabel, setCardLabel] = useState("");
  const [last4, setLast4] = useState("");
  const [first4, setFirst4] = useState("");
  const [useCustomPw, setUseCustomPw] = useState(false);
  const [customPassword, setCustomPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!bankId || !cardLabel.trim()) {
      setError("Pick a bank and give the card a name.");
      return;
    }
    if (first4 && !/^\d{4}$/.test(first4)) {
      setError("First 4 digits must be exactly 4 digits.");
      return;
    }
    if (last4 && !/^\d{4}$/.test(last4)) {
      setError("Last 4 digits must be exactly 4 digits.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankId,
        cardLabel,
        last4: last4 || undefined,
        first4: first4 || undefined,
        customPassword: useCustomPw ? customPassword : undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not add the card.");
      return;
    }
    setBankId(null);
    setCardLabel("");
    setLast4("");
    setCustomPassword("");
    setUseCustomPw(false);
    onAdded();
  }

  const input =
    "w-full rounded-lg border border-line bg-surface2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent";

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-ink2">Issuer</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BANKS.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBankId(b.id)}
              style={{ "--d": `${i * 25}ms` } as React.CSSProperties}
              className={`rise flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm ${
                bankId === b.id ? "border-accent bg-accent/10" : "border-line hover:border-muted"
              }`}
            >
              <BankBadge bankId={b.id} size={26} />
              <span className="truncate">{b.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-ink2">Card name</span>
          <input className={input} value={cardLabel} onChange={(e) => setCardLabel(e.target.value)} placeholder="e.g. Millennia, Amazon Pay" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink2">Last 4 digits (optional)</span>
          <input
            className={input}
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="4321"
            inputMode="numeric"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink2">First 4 digits (optional)</span>
          <input
            className={input}
            value={first4}
            onChange={(e) => setFirst4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="4532"
            inputMode="numeric"
          />
        </label>
      </div>
      <p className="text-xs text-muted">
        Some issuers build the statement password from the card digits. Outlay never asks for the middle eight, so a full
        card number can never be reconstructed from what it stores.
      </p>
      <label className="flex items-center gap-2 text-sm text-ink2">
        <input type="checkbox" checked={useCustomPw} onChange={(e) => setUseCustomPw(e.target.checked)} />
        This card&apos;s statement password doesn&apos;t follow a name + DOB pattern
      </label>
      {useCustomPw && (
        <input
          className={input}
          type="password"
          value={customPassword}
          onChange={(e) => setCustomPassword(e.target.value)}
          placeholder="Statement PDF password (stored encrypted)"
        />
      )}
      {error && <p className="text-sm text-bad">{error}</p>}
      <button
        onClick={submit}
        disabled={busy}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Adding…" : "Add card"}
      </button>
    </div>
  );
}
