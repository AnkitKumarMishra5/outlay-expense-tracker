"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Asks before something destructive happens. Built in the page rather than with
 * window.confirm, which embedded browsers can silently answer "cancel" to.
 */
export default function ConfirmDialog({
  title,
  children,
  confirmLabel,
  busyLabel,
  cancelLabel = "Keep it",
  onConfirm,
  onCancel,
}: {
  title: string;
  children?: React.ReactNode;
  confirmLabel: string;
  busyLabel: string;
  cancelLabel?: string;
  /** Resolves to an error to show, or nothing once it has worked. */
  onConfirm: () => Promise<string | void>;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  async function confirm() {
    setBusy(true);
    setError("");
    const problem = await onConfirm();
    if (problem) {
      setError(problem);
      setBusy(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-panel">
        <p className="text-sm font-medium">{title}</p>
        {children && <div className="mt-3 text-sm text-ink2">{children}</div>}
        {error && <p className="mt-3 text-xs text-bad">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink2 hover:border-muted hover:text-ink disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="rounded-lg bg-bad px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
