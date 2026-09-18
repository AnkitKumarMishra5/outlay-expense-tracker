"use client";

import { useCallback, useRef, useState } from "react";

/**
 * One request at a time per action. A second click while the first is still
 * on the wire is dropped, not queued, so a slow API cannot be sent the same
 * card, rule or save twice. The ref closes the gap before React re-renders
 * the button as disabled; `pending` drives the spinner.
 *
 * Keys let one hook guard a list of rows independently: `run(fn, item.id)`.
 */
export function useLock() {
  const held = useRef(new Set<string>());
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());

  const run = useCallback(async <T,>(fn: () => Promise<T>, key = ""): Promise<T | undefined> => {
    if (held.current.has(key)) return undefined;
    held.current.add(key);
    setPending(new Set(held.current));
    try {
      return await fn();
    } finally {
      held.current.delete(key);
      setPending(new Set(held.current));
    }
  }, []);

  const isPending = useCallback((key = "") => pending.has(key), [pending]);

  return { run, isPending };
}
