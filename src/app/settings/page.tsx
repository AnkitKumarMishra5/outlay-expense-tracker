"use client";

import { play } from "@/lib/sound";
import CardDigits from "@/components/CardDigits";
import PatternBuilder, { SavedPattern } from "@/components/PatternBuilder";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddCardForm from "@/components/AddCardForm";
import BankBadge from "@/components/BankBadge";
import { CardRow } from "@/lib/types";
import { useToast } from "@/components/Toasts";
import { getJson } from "@/lib/api";

export default function Settings() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ name: string; dobMasked: string; patterns: SavedPattern[] } | null>(null);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [cardQuery, setCardQuery] = useState("");
  const [account, setAccount] = useState<{ email: string | null } | null>(null);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDob, setDraftDob] = useState("");
  const [savingIdentity, setSavingIdentity] = useState(false);
  const toast = useToast();

  const loadCards = useCallback(() => {
    getJson<{ cards: CardRow[] }>("/api/cards").then((d) => d && setCards(d.cards ?? []));
  }, []);

  const visibleCards = cards.filter((c) => {
    const q = cardQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.card_label.toLowerCase().includes(q) ||
      c.bank_name.toLowerCase().includes(q) ||
      (c.last4 ?? "").includes(q)
    );
  });

  const load = () => {
    getJson<{ hasProfile: boolean; name: string; dobMasked: string; patterns: SavedPattern[] }>("/api/profile").then(
      (p) => p?.hasProfile && setProfile(p)
    );
    loadCards();
    getJson<{ email: string | null }>("/api/auth/session").then((d) => d && setAccount(d));
  };

  async function saveIdentity() {
    setSavingIdentity(true);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draftName.trim(), dob: draftDob }),
    });
    setSavingIdentity(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.push(d.error ?? "Could not save that", { tone: "bad" });
      return;
    }
    setEditingIdentity(false);
    toast.push("Statement identity updated", {
      detail: "New statements will use these. Cards already unlocked keep their saved password.",
      tone: "good",
    });
    load();
  }
  useEffect(load, [loadCards]);

  async function removeCard(id: string) {
    if (!confirm("Remove this card? Its saved statements and transactions are deleted too.")) return;
    await fetch(`/api/cards/${id}`, { method: "DELETE" });
    toast.push("Card removed", { detail: "Its statements and transactions were deleted.", tone: "warn" });
    load();
  }

  async function wipe() {
    const res = await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: confirmText }),
    });
    if (res.ok) {
      play("delete");
      toast.push("All data wiped", { tone: "bad" });
      router.push("/onboarding");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-medium text-ink2">Account</h2>
        <p className="text-sm">{account?.email ?? "Signed in"}</p>
        <p className="mt-1 text-xs text-muted">
          Statements, cards and profile on this account are encrypted with a key derived for it alone.
        </p>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.replace("/login");
          }}
          className="mt-3 rounded-lg border border-line px-3 py-1.5 text-sm text-ink2 hover:border-muted hover:text-ink"
        >
          Sign out
        </button>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-medium text-ink2">Statement identity</h2>
        {profile ? (
          <div className="text-sm">
            {editingIdentity ? (
              <div className="rounded-lg border border-line bg-surface2 p-3">
                <p className="text-xs text-ink2">
                  Both are needed together, because a statement password is built from them. Type the date of birth
                  again to confirm it.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="As printed on your card"
                    aria-label="Full name, as printed on your card"
                    className="w-56 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
                  />
                  <input
                    type="date"
                    value={draftDob}
                    onChange={(e) => setDraftDob(e.target.value)}
                    aria-label="Date of birth"
                    className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
                  />
                </div>
                <p className="mt-2 text-xs text-muted">
                  Statements already saved are untouched, and each card keeps the password that opened it. This changes
                  what future uploads try first.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={saveIdentity}
                    disabled={savingIdentity || !draftName.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(draftDob)}
                    className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
                  >
                    {savingIdentity ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => setEditingIdentity(false)}
                    className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink2 hover:border-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p>{profile.name}</p>
                  <button
                    onClick={() => {
                      setDraftName(profile.name);
                      setDraftDob("");
                      setEditingIdentity(true);
                    }}
                    className="text-xs text-accent hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Date of birth: <span className="tabular">{profile.dobMasked}</span>. Stored AES-256-GCM encrypted under a key unique to your account, displayed masked, used only to derive statement passwords.
                </p>
              </>
            )}
            <div className="mt-4 border-t border-line pt-4">
              <PatternBuilder
                patterns={profile.patterns ?? []}
                missingLast4={cards.filter((c) => !c.last4).length}
                missingFirst4={cards.filter((c) => !c.first4).length}
                onSave={async (templates) => {
                  const res = await fetch("/api/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ patterns: templates }),
                  });
                  if (!res.ok) {
                    const d = await res.json().catch(() => ({}));
                    toast.push(d.error ?? "Could not save that pattern", { tone: "bad" });
                    return;
                  }
                  const fresh = await fetch("/api/profile").then((r) => r.json());
                  if (fresh?.hasProfile) setProfile(fresh);
                  toast.push("Password patterns updated", { tone: "good" });
                }}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">No profile yet.</p>
        )}
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink2">Cards</h2>
          <button onClick={() => setShowAdd(!showAdd)} className="text-sm text-accent hover:underline">
            {showAdd ? "Close" : "+ Add card"}
          </button>
        </div>
        {cards.length > 8 && (
          <input
            value={cardQuery}
            onChange={(e) => setCardQuery(e.target.value)}
            placeholder="Search cards…"
            className="mb-3 w-full rounded-lg border border-line bg-surface2 px-3 py-1.5 text-sm outline-none placeholder:text-muted focus:border-accent sm:w-64"
          />
        )}
        <ul className="space-y-2">
          {visibleCards.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3 text-sm">
              <BankBadge bankId={c.bank_id} size={30} />
              <div className="min-w-0">
                <p>
                  {c.card_label}{" "}
                  {c.last4 ? (
                    <span className="text-xs text-muted tabular">•••• {c.last4}</span>
                  ) : (
                    <span className="text-xs text-warn">no last 4 saved</span>
                  )}
                  {c.first4 && <span className="ml-2 text-xs text-muted tabular">{c.first4} ••••</span>}
                </p>
                <p className="text-xs text-muted">
                  {c.has_password ? "statement password stored, AES-256-GCM encrypted" : "statement password derived on first upload"}
                </p>
              </div>
              <span className="ml-auto flex items-center gap-3">
                <CardDigits cardId={c.id} last4={c.last4} first4={c.first4} onSaved={loadCards} />
                <button onClick={() => removeCard(c.id)} className="text-xs text-muted hover:text-bad">
                  Remove
                </button>
              </span>
            </li>
          ))}
          {cards.length === 0 && <p className="text-sm text-muted">No cards yet.</p>}
          {cards.length > 0 && visibleCards.length === 0 && (
            <p className="text-sm text-muted">No cards match “{cardQuery}”.</p>
          )}
        </ul>
        {showAdd && (
          <div className="mt-4 border-t border-line pt-4">
            <AddCardForm
              onAdded={() => {
                setShowAdd(false);
                toast.push("Card added", { tone: "good" });
                load();
              }}
            />
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-2 text-sm font-medium text-ink2">Your data</h2>
        <p className="mb-3 text-sm text-ink2">
          All data is stored in a Postgres database you control. Export it at any time.
        </p>
        <a
          href="/api/export"
          onClick={(e) => {
            // The server has no idea what day it is where you are, so without
            // this the filename would carry its date instead of yours. Setting
            // href here lets the browser handle the download itself.
            try {
              const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
              if (tz) e.currentTarget.href = `/api/export?tz=${encodeURIComponent(tz)}`;
            } catch {}
          }}
          className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-muted"
        >
          Download JSON export
        </a>
      </section>

      <section className="card border-bad/30 p-5">
        <h2 className="mb-2 text-sm font-medium text-bad">Danger zone</h2>
        <p className="mb-3 text-sm text-ink2">
          Deletes the profile, all cards, statements and transactions. Type <code className="text-ink">DELETE EVERYTHING</code> to confirm.
        </p>
        <div className="flex gap-2">
          <input
            className="w-56 rounded-lg border border-line bg-surface2 px-3 py-1.5 text-sm outline-none focus:border-bad"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE EVERYTHING"
          />
          <button
            onClick={wipe}
            disabled={confirmText !== "DELETE EVERYTHING"}
            className="rounded-lg bg-bad px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Wipe all data
          </button>
        </div>
      </section>
    </div>
  );
}
