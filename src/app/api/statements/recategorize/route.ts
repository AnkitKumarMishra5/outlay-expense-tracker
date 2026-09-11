import { NextRequest, NextResponse } from "next/server";
import { currentUserId, unauthorized } from "@/lib/auth";
import { reviewStatements } from "@/lib/aiReview";

export const maxDuration = 60;

/** Review several saved statements in one model call. Body: { statementIds: string[] }. */
export async function POST(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const ids: unknown = body?.statementIds;
  if (!Array.isArray(ids)) return NextResponse.json({ error: "statementIds must be a list." }, { status: 400 });
  const result = await reviewStatements(userId, ids.filter((s): s is string => typeof s === "string"));
  if (!result.ok) {
    return NextResponse.json({ error: result.error, statements: result.statements, cards: result.cards }, { status: result.status ?? 500 });
  }
  return NextResponse.json({ ok: true, statements: result.statements, cards: result.cards });
}
