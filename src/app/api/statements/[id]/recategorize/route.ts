import { NextRequest, NextResponse } from "next/server";
import { currentUserId, unauthorized } from "@/lib/auth";
import { reviewStatements } from "@/lib/aiReview";

export const maxDuration = 60;

/** Review one saved statement. Same engine as the bulk route, one review off its card. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const result = await reviewStatements(userId, [id]);
  const s = result.statements[0];
  const ai = s ? result.cards[s.cardId] : undefined;
  if (!result.ok) {
    const error =
      s?.skipped === "no-reviews-left"
        ? "This card has had both of its AI reviews for the month. They come back on the 1st."
        : result.error;
    return NextResponse.json({ error, ai }, { status: result.status ?? 500 });
  }
  return NextResponse.json({
    ok: true,
    changed: s.changed,
    reviewed: s.reviewed,
    changes: s.changes,
    changedIds: s.changes.map((ch) => ch.id),
    ai,
  });
}
