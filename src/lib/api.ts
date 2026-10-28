"use client";

/**
 * Responses kept in memory for this tab, so moving between pages shows what was
 * already loaded instead of fetching it again. Any change made through the API
 * clears it, here and in other open tabs, and an entry also lapses after a few
 * minutes in case something changed on another device. Never written to disk.
 */
const cache = new Map<string, { at: number; data: unknown }>();
/** Reads already on their way, so two components asking at once share one request. */
const pending = new Map<string, Promise<unknown>>();
const MAX_AGE_MS = 5 * 60_000;
/** Read live every time: whether the session is still valid is the point of asking. */
const UNCACHED = /^\/api\/auth\//;

let channel: BroadcastChannel | null = null;
/** Bumped on every clear, so a read that was in flight across a change is not kept. */
let generation = 0;

export function clearApiCache() {
  cache.clear();
  pending.clear();
  generation++;
}

/**
 * Clears the cache after every write to the API, whichever component makes it,
 * and tells other tabs to do the same. Installed once, from the root layout.
 */
export function installApiCacheInvalidation() {
  if (typeof window === "undefined" || (window.fetch as { cacheAware?: boolean }).cacheAware) return;
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel("outlay-api-cache");
    channel.onmessage = clearApiCache;
  }
  const original = window.fetch.bind(window);
  const wrapped = async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(url, window.location.href).pathname;
    if (method === "GET" || !path.startsWith("/api/")) return original(input, init);
    try {
      return await original(input, init);
    } finally {
      clearApiCache();
      channel?.postMessage("clear");
    }
  };
  window.fetch = Object.assign(wrapped, { cacheAware: true });
}

export async function getJson<T>(url: string, onExpired?: () => void): Promise<T | null> {
  const cacheable = !UNCACHED.test(url);
  const hit = cacheable ? cache.get(url) : undefined;
  // A copy, so a page editing what it was given cannot change the cached original.
  if (hit && Date.now() - hit.at < MAX_AGE_MS) return structuredClone(hit.data) as T;

  let request = cacheable ? (pending.get(url) as Promise<{ status: number; data: T | null }> | undefined) : undefined;
  if (!request) {
    const started = generation;
    request = fetch(url).then(async (res) => {
      const data = res.ok ? ((await res.json().catch(() => null)) as T | null) : null;
      if (cacheable && data !== null && started === generation) cache.set(url, { at: Date.now(), data: structuredClone(data) });
      return { status: res.status, data };
    });
    if (cacheable) {
      pending.set(url, request);
      const settled = () => {
        if (pending.get(url) === request) pending.delete(url);
      };
      request.then(settled, settled);
    }
  }
  const { status, data } = await request;
  if (status === 401) {
    clearApiCache();
    onExpired?.();
    return null;
  }
  return data === null ? null : (structuredClone(data) as T);
}
