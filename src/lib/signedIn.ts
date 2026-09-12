"use client";

import { useSyncExternalStore } from "react";

/** Whether a session cookie is live. Decides what to offer, never what to allow. */
function read(): boolean {
  if (typeof document === "undefined") return false;
  const match = document.cookie.match(/(?:^|;\s*)outlay_expires_at=(\d+)/);
  return match ? Number(match[1]) > Date.now() : false;
}

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  window.addEventListener("focus", onChange);
  return () => {
    clearInterval(id);
    window.removeEventListener("focus", onChange);
  };
}

export function useSignedIn(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
