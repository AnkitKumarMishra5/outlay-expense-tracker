"use client";

import { useState } from "react";
import AiOverlay, { BotMark, OverlayCard } from "./AiOverlay";
import { play } from "@/lib/sound";
import { useToast } from "./Toasts";
import { AiState } from "@/lib/aiQuota";

export default function AiReview({
  statementId,
  rows,
  ai,
  onChanged,
  card,
  merchants = [],
}: {
  statementId: string;
  rows: number;
  ai: AiState;
  onChanged: (changedIds: string[]) => void;
  card?: OverlayCard | null;
  merchants?: string[];
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [bad, setBad] = useState(false);

  const exhausted = ai.configured && ai.remaining <= 0;
  const disabled = busy || !ai.configured || exhausted;

  async function run() {
    play("scan");
    setBusy(true);
    setNote("");
    setBad(false);
    const res = await fetch(`/api/statements/${statementId}/recategorize`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setBad(true);
      const message = body.error ?? "The AI could not review this statement right now. Your categories are unchanged, and this did not use up a review.";
      setNote(message);
      toast.push("AI review did not happen", { detail: message, tone: "warn" });
      return;
    }
    play("sparkle");
    const message =
      body.changed === 0
        ? `Looked at all ${body.reviewed} merchants. Every category was already right.`
        : `Refined ${body.changed} of ${body.reviewed} categories, highlighted below.`;
    setNote(message);
    toast.push("AI review done", {
      detail: `${message} ${body.ai?.remaining ?? 0} of ${body.ai?.limit ?? 2} AI reviews left for this card this month.`,
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
                ? "Both AI reviews for this card are used this month. They come back on the 1st."
                : `Have the AI re-read all ${rows} merchant names and correct any wrong categories`
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
              ? "Both AI reviews for this card are used this month, back on the 1st"
              : `${ai.remaining} of ${ai.limit} AI reviews left for this card this month`}
        </span>
        {note && <span className={`text-[11px] ${bad ? "text-bad" : "text-good"}`}>{note}</span>}
      </span>

      {busy && (
        <AiOverlay
          kicker="AI is reviewing your categories"
          title={`Reading ${rows} merchant names`}
          footnote="One of the two AI reviews this card gets each month. Only merchant names are sent, never amounts or card details."
          card={card}
          merchants={merchants}
        />
      )}
    </>
  );
}
