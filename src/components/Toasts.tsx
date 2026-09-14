"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { play } from "@/lib/sound";

type Tone = "info" | "good" | "warn" | "bad";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  detail?: string;
  tone: Tone;
  duration: number;
  action?: ToastAction;
  leaving?: boolean;
}

interface ToastApi {
  push: (message: string, options?: { detail?: string; tone?: Tone; duration?: number; action?: ToastAction }) => void;
}

const Ctx = createContext<ToastApi>({ push: () => {} });

export const useToast = () => useContext(Ctx);

const ICON: Record<Tone, React.ReactNode> = {
  good: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.8 8.2l2.1 2.1 4.2-4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  warn: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1.8L15 14H1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6v3.4M8 11.6v.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  bad: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.2v4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
    </svg>
  ),
};

const TONE_CLASS: Record<Tone, string> = {
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
  info: "text-accent",
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const remove = useCallback((id: number) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 280);
  }, []);

  const push = useCallback<ToastApi["push"]>(
    (message, options) => {
      const id = ++seq.current;
      const duration = options?.duration ?? 4200;
      const tone = options?.tone ?? "info";
      play(tone === "good" ? "success" : tone === "bad" ? "error" : "tick");
      setToasts((list) => [...list.slice(-3), { id, message, detail: options?.detail, tone, duration, action: options?.action }]);
      setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  const api = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div className="toast-stack" role="status" aria-live="polite">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`card ${t.leaving ? "toast-out" : "toast-in"} relative overflow-hidden p-3 pr-9 shadow-lg`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`mt-0.5 shrink-0 ${TONE_CLASS[t.tone]}`}>{ICON[t.tone]}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t.message}</p>
                    {t.detail && <p className="mt-0.5 text-xs leading-snug text-ink2">{t.detail}</p>}
                    {t.action && (
                      <button
                        type="button"
                        onClick={() => {
                          remove(t.id);
                          t.action!.onClick();
                        }}
                        className="mt-2 rounded-md border border-line px-2.5 py-1 text-xs text-ink hover:border-accent hover:text-accent"
                      >
                        {t.action.label}
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => remove(t.id)}
                  aria-label="Dismiss"
                  className="absolute right-2 top-2 rounded p-1 text-muted hover:text-ink"
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <span
                  className={`toast-life absolute bottom-0 left-0 h-[2px] ${TONE_CLASS[t.tone]} bg-current opacity-40`}
                  style={{ animationDuration: `${t.duration}ms` }}
                />
              </div>
            ))}
          </div>,
          document.body
        )}
    </Ctx.Provider>
  );
}
