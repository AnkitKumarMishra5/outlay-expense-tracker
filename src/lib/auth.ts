import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionSecret, verifyToken } from "./session";
import { db } from "./db";

export async function currentUserId(req: NextRequest): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const claims = await verifyToken(secret, req.cookies.get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  const c = await db();
  const rs = await c.execute("SELECT id FROM users WHERE id = $1", [claims.userId]);
  return rs.rows.length ? claims.userId : null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
}
