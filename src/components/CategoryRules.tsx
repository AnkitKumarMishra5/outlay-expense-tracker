"use client";

import { useCallback, useEffect, useState } from "react";
import CategorySelect from "./CategorySelect";
import { useToast } from "./Toasts";
import { SPEND_CATEGORIES } from "@/lib/categories";
import { categoryColor, useChartTokens } from "@/lib/chartTokens";
import { play } from "@/lib/sound";
import { monthTitle } from "@/lib/format";

interface Rule {
  id: string;
  keyword: string;
  category: string;
}

/**
 * Keyword rules the reader sets themselves. They beat the built-in list when a
 * statement is read, and are handed to the model as hard rules when it runs,
 * so both paths agree on what a merchant is.
 */
export default function CategoryRules() {
  const toast = useToast();
  const tokens = useChartTokens();
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string>(SPEND_CATEGORIES[0]);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  /** Picking a real transaction beats remembering how a merchant is spelled. */
  const [picking, setPicking] = useState(true);
  const [month, setMonth] = useState<string | null>(null);
  const [months, setMonths] = useState<string[] | null>(null);
  /** One entry per description, with how often it appears on that month's statements. */
  const [found, setFound] = useState<{ description: string; n: number }[] | null>(null);
  const [spends, setSpends] = useState(0);

  const load = useCallback(() => {
    fetch("/api/category-rules")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setRules(d.rules ?? []))
      .catch(() => {});
  }, []);
  useEffect(load, [load]);

  // Months here are statement months, as everywhere else.
  useEffect(() => {
    if (!picking || months) return;
    let live = true;
    fetch("/api/transactions?limit=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setMonths(d?.months ?? []))
      .catch(() => live && setMonths([]));
    return () => {
      live = false;
    };
  }, [picking, months]);

  // Every spend on that month's statements, not the first page of them.
  // Credits are left out: they are always Credits, so a rule has nothing to do.
  useEffect(() => {
    if (!picking || !month) return;
    let live = true;
    fetch(`/api/transactions?month=${month}&type=debit&limit=1000`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!live) return;
        const counts = new Map<string, { description: string; n: number }>();
        for (const t of (d?.transactions ?? []) as { description: string }[]) {
          const k = t.description.trim().toLowerCase();
          const entry = counts.get(k);
          if (entry) entry.n++;
          else counts.set(k, { description: t.description.trim(), n: 1 });
        }
        setSpends(Number(d?.total ?? 0));
        setFound([...counts.values()].sort((a, b) => b.n - a.n || a.description.localeCompare(b.description)));
      })
      .catch(() => live && setFound([]));
    return () => {
      live = false;
    };
  }, [picking, month]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const word = keyword.trim();
    if (word.length < 2) {
      toast.push("Give the keyword at least two characters.", { tone: "bad" });
      return;
    }
    setBusy(true);
    const res = await fetch("/api/category-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: word, category }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      toast.push(data?.error ?? "That rule could not be saved.", { tone: "bad" });
      return;
    }
    play("success");
    setKeyword("");
    load();
  }

  async function remove(rule: Rule) {
    const res = await fetch(`/api/category-rules?id=${encodeURIComponent(rule.id)}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      toast.push("That rule could not be removed.", { tone: "bad" });
      return;
    }
    play("delete");
    setRules((prev) => prev?.filter((r) => r.id !== rule.id) ?? prev);
  }

  const q = filter.trim().toLowerCase();
  const shown = (rules ?? []).filter(
    (r) => !q || r.keyword.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
  );

  return (
    <div className="card p-5">
      <button className="rules-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>
          <span className="rules-title">Your category rules</span>
          <span className="rules-count">{rules ? `${rules.length} saved` : "…"}</span>
        </span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className={open ? "rotate-180" : ""}>
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <p className="rules-intro">
        A word in a transaction&rsquo;s description, and the category it should always get. These beat
        Outlay&rsquo;s own guesses, and the AI is told about them before it runs, so both agree.
      </p>

      {open && (
        <>
          <div className="rules-mode" role="group" aria-label="How to set the keyword">
            <button type="button" onClick={() => setPicking(true)} aria-pressed={picking} className={picking ? "is-on" : ""}>
              Pick a transaction
            </button>
            <button type="button" onClick={() => setPicking(false)} aria-pressed={!picking} className={picking ? "" : "is-on"}>
              Type a keyword
            </button>
          </div>

          {picking && (
            <div className="rules-pick">
              <select
                value={month ?? ""}
                onChange={(e) => {
                  setFound(null);
                  setMonth(e.target.value || null);
                }}
                aria-label="Statement month to pick a transaction from"
                className="rules-input rules-month"
              >
                <option value="">{months === null ? "Loading…" : months.length ? "Statement month" : "No statements yet"}</option>
                {(months ?? []).map((m) => (
                  <option key={m} value={m}>
                    {monthTitle(m)} statement
                  </option>
                ))}
              </select>
              <select
                value=""
                disabled={!month}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setKeyword(e.target.value);
                  play("tick");
                }}
                aria-label="Transaction to take the keyword from"
                className="rules-input"
              >
                <option value="">
                  {!month
                    ? "Pick a statement month first"
                    : found === null
                      ? "Loading…"
                      : found.length === 0
                        ? "No spends on that statement"
                        : `${spends} spend${spends === 1 ? "" : "s"} on the ${monthTitle(month)} statement`}
                </option>
                {(found ?? []).map((t) => (
                  <option key={t.description.toLowerCase()} value={t.description}>
                    {t.description}
                    {t.n > 1 ? `  ×${t.n}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={add} className="rules-form">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={picking ? "Trim this to the part that repeats" : "A word from the description"}
              maxLength={60}
              aria-label="Keyword to match in a description"
              className="rules-input"
            />
            <CategorySelect value={category} onChange={setCategory} label="Category for this keyword" />
            <button type="submit" disabled={busy} className="rules-add">
              {busy ? "Saving…" : "Add rule"}
            </button>
          </form>

          {(rules?.length ?? 0) > 8 && (
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter rules…"
              aria-label="Filter rules"
              className="rules-input rules-filter"
            />
          )}

          {rules === null ? (
            <div className="shimmer mt-3 h-24 w-full" />
          ) : shown.length === 0 ? (
            <p className="rules-empty">
              {rules.length === 0
                ? "No rules yet. Add one and every statement read from now on will follow it."
                : "No rule matches that."}
            </p>
          ) : (
            <ul className="rules-list">
              {shown.map((r) => (
                <li key={r.id} className="rules-row">
                  <span className="rules-dot" style={{ background: categoryColor(r.category, tokens) }} aria-hidden />
                  <span className="rules-key">{r.keyword}</span>
                  <span className="rules-arrow" aria-hidden>
                    →
                  </span>
                  <span className="rules-cat">{r.category}</span>
                  <button onClick={() => remove(r)} aria-label={`Remove the rule for ${r.keyword}`} className="rules-del">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="rules-foot">
            Rules apply when a statement is read and when AI runs. They do not rewrite transactions
            already saved. Change those from the Transactions page, or run Recategorise there.
          </p>
        </>
      )}
    </div>
  );
}
