"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddCardForm from "@/components/AddCardForm";
import BankBadge from "@/components/BankBadge";
import { CardRow } from "@/lib/types";
import Logo from "@/components/Logo";
import { APP_BYLINE, APP_NAME } from "@/lib/developer";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cards, setCards] = useState<CardRow[]>([]);

  const loadCards = () =>
    fetch("/api/cards").then((r) => r.json()).then((d) => setCards(d.cards ?? []));
  useEffect(() => {
    if (step === 2) loadCards();
  }, [step]);

  async function saveProfile() {
    if (!name.trim() || !dob) {
      setError("Both fields are required. Statement passwords are derived from them.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, dob }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not save.");
      return;
    }
    setStep(2);
  }

  const input =
    "w-full rounded-lg border border-line bg-surface2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rise mb-8 mt-6 text-center">
        <div className="mx-auto mb-4 w-fit">
          <Logo size={48} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to {APP_NAME}</h1>
        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">{APP_BYLINE}</p>
        <p className="mt-2 text-sm text-ink2">
          Upload credit card statement PDFs each month. Outlay unlocks them, verifies the numbers, and builds a spending dashboard. Files are parsed in memory and never written to disk, and reading them never uses AI.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-center gap-2 text-xs text-muted">
        <span className={step === 1 ? "font-semibold text-ink" : ""}>1 · About you</span>
        <span>→</span>
        <span className={step === 2 ? "font-semibold text-ink" : ""}>2 · Your cards</span>
      </div>

      {step === 1 && (
        <div className="card rise space-y-4 p-6" style={{ "--d": "120ms" } as React.CSSProperties}>
          <label className="block text-sm">
            <span className="mb-1 block text-ink2">Full name (exactly as printed on your cards)</span>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="As printed on your card" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink2">Date of birth</span>
            <input className={input} type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
          </label>
          <p className="rounded-lg bg-surface2 p-3 text-xs leading-relaxed text-ink2">
            Indian banks password-protect statement PDFs with combinations of the holder&apos;s name and date of birth, commonly the first four letters of the name followed by <code className="text-ink">DDMM</code>. Some issuers use the <strong>first four or last four digits of the card number</strong> instead, or as well. You can add those digits with each card on the next step, and they are optional. Outlay derives each statement password from whichever of these an issuer uses. Every one of these values is stored <strong>AES-256-GCM encrypted</strong> under a key unique to your account, and the middle eight digits are never asked for, so a full card number cannot be reconstructed.
          </p>
          {error && <p className="text-sm text-bad">{error}</p>}
          <button onClick={saveProfile} disabled={busy} className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {busy ? "Saving…" : "Continue"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="rise space-y-4">
          {cards.length > 0 && (
            <div className="card p-4">
              <p className="mb-3 text-sm font-medium text-ink2">Added so far</p>
              <ul className="space-y-2">
                {cards.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <BankBadge bankId={c.bank_id} size={24} />
                    <span>{c.card_label}</span>
                    {c.last4 && <span className="text-xs text-muted tabular">•••• {c.last4}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="card p-6">
            <AddCardForm onAdded={loadCards} />
          </div>
          <button
            onClick={() => router.push("/upload")}
            disabled={cards.length === 0}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            Finish and upload the first statement
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-lg border border-line px-4 py-2 text-sm text-ink2 transition-colors hover:border-muted hover:text-ink"
          >
            {cards.length === 0 ? "Skip for now, add cards later" : "Go to the dashboard"}
          </button>
          <p className="text-center text-xs text-muted">
            You can add cards any time from Settings, or let the first statement you upload create them for you.
          </p>
        </div>
      )}
    </div>
  );
}
