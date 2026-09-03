import { NextRequest, NextResponse } from "next/server";
import { db, now, uid } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { issueToken, sessionSecret } from "@/lib/session";
import { attachSession } from "@/lib/authCookies";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const invite = typeof body.invite === "string" ? body.invite : "";

  const required = process.env.SIGNUP_INVITE_CODE;
  if (!required) {
    return NextResponse.json({ error: "This deployment is not accepting new accounts." }, { status: 503 });
  }
  if (invite !== required) {
    return NextResponse.json({ error: "That invite code is not valid." }, { status: 403 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 10) {
    return NextResponse.json({ error: "Use at least 10 characters." }, { status: 400 });
  }

  const c = await db();
  const existing = await c.execute("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const id = uid();
  await c.execute("INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4)", [id, email, hashPassword(password), now()]);
  const secret = sessionSecret();
  if (!secret) return NextResponse.json({ error: "Server key missing." }, { status: 503 });
  const { token, expiresAt } = await issueToken(secret, id);
  return attachSession(
    NextResponse.json({ ok: true, email }),
    token,
    expiresAt,
    req.nextUrl.protocol === "https:"
  );
}
