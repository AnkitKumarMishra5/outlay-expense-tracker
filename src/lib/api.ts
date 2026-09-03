"use client";

export async function getJson<T>(url: string, onExpired?: () => void): Promise<T | null> {
  const res = await fetch(url);
  if (res.status === 401) {
    onExpired?.();
    return null;
  }
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as T | null;
}
