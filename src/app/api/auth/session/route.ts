import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, issueToken, sessionSecret, verifyToken } from "@/lib/session";
import { attachSession, clearSession } from "@/lib/authCookies";

export async function GET(req: NextRequest) {
  const secret = sessionSecret();
  if (!secret) return NextResponse.json({ active: false });
  const claims = await verifyToken(secret, req.cookies.get(SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ active: false });
  const c = await db();
  const rs = await c.execute("SELECT email FROM users WHERE id = $1", [claims.userId]);
  if (rs.rows.length === 0) return clearSession(NextResponse.json({ active: false }));
  return NextResponse.json({
    active: true,
    expiresAt: claims.expiresAt,
    email: rs.rows[0].email,
  });
}

export async function POST(req: NextRequest) {
  const secret = sessionSecret();
  if (!secret) return NextResponse.json({ active: false });
  const claims = await verifyToken(secret, req.cookies.get(SESSION_COOKIE)?.value);
  if (!claims) return clearSession(NextResponse.json({ active: false }, { status: 401 }));
  const { token, expiresAt } = await issueToken(secret, claims.userId);
  return attachSession(
    NextResponse.json({ active: true, expiresAt }),
    token,
    expiresAt,
    req.nextUrl.protocol === "https:"
  );
}
