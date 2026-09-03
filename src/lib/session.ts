const IDLE_MINUTES = Number(process.env.AUTH_IDLE_MINUTES ?? 15);
export const IDLE_MS = Math.max(1, IDLE_MINUTES) * 60_000;
export const SESSION_COOKIE = "outlay_session";
export const EXPIRY_COOKIE = "outlay_expires_at";

const encoder = new TextEncoder();

function b64url(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < view.length; i++) s += String.fromCharCode(view[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function equalConstantTime(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function sessionSecret(): string | null {
  const key = process.env.APP_ENCRYPTION_KEY;
  return key ? `outlay-session:${key}` : null;
}

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return b64url(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

export async function issueToken(secret: string, userId: string, now = Date.now()) {
  const expiresAt = now + IDLE_MS;
  const payload = `${userId}.${expiresAt}.${now}`;
  return { token: `${payload}.${await sign(secret, payload)}`, expiresAt };
}

export interface SessionClaims {
  userId: string;
  expiresAt: number;
}

export async function verifyToken(
  secret: string,
  token: string | undefined,
  now = Date.now()
): Promise<SessionClaims | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, expiresAt, issuedAt, signature] = parts;
  const expected = await sign(secret, `${userId}.${expiresAt}.${issuedAt}`);
  if (!equalConstantTime(signature, expected)) return null;
  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry <= now) return null;
  if (!userId) return null;
  return { userId, expiresAt: expiry };
}
