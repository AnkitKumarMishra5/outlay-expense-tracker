import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { issueToken, sessionSecret } from "@/lib/session";
import { attachSession } from "@/lib/authCookies";

export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const t = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < t) {
    attempts.set(key, { count: 1, resetAt: t + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(`${ip}:${email}`)) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute and try again." }, { status: 429 });
  }

  const c = await db();
  const rs = await c.execute("SELECT id, password_hash FROM users WHERE email = $1", [email]);
  const row = rs.rows[0] as unknown as { id: string; password_hash: string } | undefined;
  const ok = row ? verifyPassword(password, row.password_hash) : false;
  if (!row || !ok) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }
  attempts.delete(`${ip}:${email}`);

  const secret = sessionSecret();
  if (!secret) return NextResponse.json({ error: "Server key missing." }, { status: 503 });
  const { token, expiresAt } = await issueToken(secret, row.id);
  return attachSession(
    NextResponse.json({ ok: true, expiresAt }),
    token,
    expiresAt,
    req.nextUrl.protocol === "https:"
  );
}
