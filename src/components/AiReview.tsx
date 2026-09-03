"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "./Toasts";
import { AiState } from "@/lib/aiQuota";

const STAGES = [
  "Reading every merchant name",
  "Working out what each one is",
  "Writing the corrections back",
];

function BotMark() {
  return (
    <svg viewBox="0 0 48 48" className="ai-bot" fill="none" aria-hidden>
      <rect x="11" y="16" width="26" height="20" rx="7" className="ai-bot-body" />
      <path d="M24 16V9" className="ai-bot-stem" />
      <circle cx="24" cy="7" r="2.6" className="ai-bot-lamp" />
      <circle cx="19" cy="25" r="2.5" className="ai-bot-eye" />
      <circle cx="29" cy="25" r="2.5" className="ai-bot-eye ai-bot-eye-2" />
      <path d="M20 31.5h8" className="ai-bot-mouth" />
      <path d="M11 22H7.5M37 22h3.5" className="ai-bot-arm" />
    </svg>
  );
}

export default function AiReview({
  statementId,
  rows,
  ai,
  onChanged,
}: {
  statementId: string;
  rows: number;
  ai: AiState;
  onChanged: (changedIds: string[]) => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [note, setNote] = useState("");
  const [bad, setBad] = useState(false);

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1800);
    return () => clearInterval(id);
  }, [busy]);

  const exhausted = ai.configured && ai.remaining <= 0;
  const disabled = busy || !ai.configured || exhausted;

  async function run() {
    setStage(0);
    setBusy(true);
    setNote("");
    setBad(false);
    const res = await fetch(`/api/statements/${statementId}/recategorize`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setBad(true);
      const message = body.error ?? "The review did not complete. No review was used.";
      setNote(message);
      toast.push("AI review failed", { detail: message, tone: "bad" });
      return;
    }
    const message =
      body.changed === 0
        ? `Checked ${body.reviewed} transactions. Every category was already right.`
        : `Recategorised ${body.changed} of ${body.reviewed} transactions.`;
    setNote(message);
    toast.push("AI review complete", {
      detail: `${message} ${body.ai.remaining} of ${body.ai.limit} reviews left this month.`,
      tone: "good",
      duration: 6000,
    });
    onChanged(body.changedIds ?? []);
  }

  return (
    <>
      <span className="flex flex-wrap items-center gap-2">
        <button
          onClick={run}
          disabled={disabled}
          title={
            !ai.configured
              ? "AI review is not enabled on this deployment."
              : exhausted
                ? "This card has used both of its AI reviews for the month."
                : `Have the model re-read all ${rows} merchant names and correct any wrong categories`
          }
          className="ai-btn"
        >
          <BotMark />
          Recheck categories with AI
        </button>
        <span className="text-[11px] text-muted">
          {!ai.configured
            ? "Not enabled on this deployment"
            : exhausted
              ? `${ai.limit} of ${ai.limit} reviews used this month, resets on the 1st`
              : `${ai.remaining} of ${ai.limit} reviews left for this card this month`}
        </span>
        {note && <span className={`text-[11px] ${bad ? "text-bad" : "text-good"}`}>{note}</span>}
      </span>

      {busy &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="ai-scrim" role="status" aria-live="polite">
            <div className="ai-panel">
              <div className="ai-bot-stage" aria-hidden>
                <span className="ai-ring" />
                <span className="ai-ring" />
                <BotMark />
              </div>
              <p className="ai-kicker">AI is reviewing your categories</p>
              <p className="mt-1 text-sm font-medium">Reading {rows} merchant names</p>
              <ul className="ai-stages">
                {STAGES.map((s, i) => (
                  <li key={s} className={i < stage ? "done" : i === stage ? "active" : ""}>
                    <span className="ai-stage-dot" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-muted">
                This uses one of the two AI reviews this card gets each month.
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
