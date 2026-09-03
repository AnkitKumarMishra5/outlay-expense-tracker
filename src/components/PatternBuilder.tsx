"use client";

import { useState } from "react";
import { PATTERN_TOKENS, SAMPLE_IDENTITY, describePattern, renderPattern, sampleFor } from "@/lib/passwords";

export interface SavedPattern {
  template: string;
  describe: string;
  preview: string;
}

export default function PatternBuilder({
  patterns,
  onSave,
  missingLast4 = 0,
  missingFirst4 = 0,
}: {
  patterns: SavedPattern[];
  onSave: (templates: string[]) => Promise<void>;
  missingLast4?: number;
  missingFirst4?: number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [literal, setLiteral] = useState("");
  const [busy, setBusy] = useState(false);

  async function commit(next: string[]) {
    setBusy(true);
    await onSave(next);
    setBusy(false);
  }

  const full = patterns.length >= 10;

  const chip = "rounded-md border border-line px-2 py-1 text-[11px] text-ink2 hover:border-accent hover:text-accent";

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">Password patterns</p>
        <button
          onClick={() => setOpen((o) => !o)}
          disabled={!open && patterns.length >= 10}
          className="text-xs text-accent hover:underline disabled:text-muted disabled:no-underline"
        >
          {open ? "Done" : patterns.length >= 10 ? "10 of 10 saved" : "Add a pattern"}
        </button>
      </div>
      <p className="mt-1 text-xs text-ink2">
        Outlay already tries fourteen common combinations of your name, date of birth and card digits. If your bank uses
        something different, teach it here once and every future statement opens on its own.
      </p>

      {patterns.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {patterns.map((p) => (
            <li key={p.template} className="flex items-center gap-2 rounded-lg border border-line bg-surface2 px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs text-ink">{p.describe}</span>
                <span className="block text-[10px] text-muted">
                  for the example above: <span className="font-mono text-ink2">{p.preview || "—"}</span>
                </span>
                {p.template.includes("{LAST4}") && missingLast4 > 0 && (
                  <span className="mt-0.5 block text-[10px] text-warn">
                    Skipped on {missingLast4} card{missingLast4 === 1 ? "" : "s"} with no last 4 digits saved.
                  </span>
                )}
                {p.template.includes("{FIRST4}") && missingFirst4 > 0 && (
                  <span className="mt-0.5 block text-[10px] text-warn">
                    Skipped on {missingFirst4} card{missingFirst4 === 1 ? "" : "s"} with no first 4 digits saved.
                  </span>
                )}
              </span>
              <button
                onClick={() => commit(patterns.filter((x) => x.template !== p.template).map((x) => x.template))}
                disabled={busy}
                aria-label={`Remove pattern ${p.describe}`}
                className="shrink-0 rounded-md border border-line px-1.5 py-0.5 text-[11px] text-muted hover:border-bad hover:text-bad"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="mt-3 rounded-lg border border-line bg-surface2 p-3">
          <div className="rounded-md border border-line bg-surface px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted">Worked example</p>
            <p className="mt-1 text-xs text-ink2">
              Say your name is <span className="text-ink">{SAMPLE_IDENTITY.name}</span>, born{" "}
              <span className="text-ink">{SAMPLE_IDENTITY.dobLabel}</span>, card number{" "}
              <span className="font-mono text-ink">{SAMPLE_IDENTITY.cardLabel}</span>. Each piece below would be:
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              {PATTERN_TOKENS.map((t) => (
                <li key={t.id} className="flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="truncate text-muted">{t.label}</span>
                  <span className="font-mono text-ink2">{sampleFor(t.id) || "—"}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-line pt-2 text-[11px] text-muted">
              So a bank using <span className="text-ink">NAME</span> then <span className="text-ink">DD</span> then{" "}
              <span className="text-ink">MM</span> gives{" "}
              <span className="font-mono text-ink">
                {renderPattern("{NAME4U}{DD}{MM}", SAMPLE_IDENTITY.name, SAMPLE_IDENTITY.dob, SAMPLE_IDENTITY.last4, SAMPLE_IDENTITY.first4)}
              </span>
              .
            </p>
          </div>

          {(missingLast4 > 0 || missingFirst4 > 0) && (
            <p className="mt-3 text-xs text-warn">
              A pattern using card digits is skipped on any card that has none saved. Right now{" "}
              {missingLast4 > 0 && `${missingLast4} card${missingLast4 === 1 ? " has" : "s have"} no last 4`}
              {missingLast4 > 0 && missingFirst4 > 0 && ", and "}
              {missingFirst4 > 0 && `${missingFirst4} card${missingFirst4 === 1 ? " has" : "s have"} no first 4`}. Add
              them on the cards below.
            </p>
          )}

          <p className="mt-3 text-xs text-ink2">
            Now tap the pieces in the order <span className="text-ink">your</span> password uses them.
            {full && <span className="text-warn"> You already have 10 patterns, remove one first.</span>}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {PATTERN_TOKENS.map((t) => (
              <button key={t.id} title={t.hint} onClick={() => setDraft((d) => `${d}{${t.id}}`)} className={chip}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <input
              value={literal}
              onChange={(e) => setLiteral(e.target.value)}
              placeholder="any fixed letters, like @ or 01"
              className="w-52 rounded-md border border-line bg-surface px-2 py-1 text-xs outline-none focus:border-accent"
            />
            <button
              onClick={() => {
                setDraft((d) => d + literal);
                setLiteral("");
              }}
              disabled={!literal}
              className={`${chip} disabled:opacity-40`}
            >
              Add text
            </button>
          </div>

          <div className="mt-3 rounded-md border border-line bg-surface px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted">Your pattern</p>
            <p className="mt-0.5 text-sm text-ink">{draft ? describePattern(draft) : "nothing yet"}</p>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => setDraft("")} disabled={!draft} className={`${chip} disabled:opacity-40`}>
              Clear
            </button>
            <button
              onClick={() => setDraft((d) => d.replace(/\{[A-Z0-9]+\}$|.$/, ""))}
              disabled={!draft}
              className={`${chip} disabled:opacity-40`}
            >
              Undo
            </button>
            <button
              onClick={async () => {
                await commit([...patterns.map((p) => p.template), draft]);
                setDraft("");
                setOpen(false);
              }}
              disabled={!draft || busy || full || patterns.some((p) => p.template === draft)}
              className="ml-auto rounded-md bg-accent px-3 py-1 text-[11px] font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              Save pattern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
