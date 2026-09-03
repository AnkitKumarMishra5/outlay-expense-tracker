import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { aiCategorize } from "@/lib/ai";
import { aiState, consumeAi } from "@/lib/aiQuota";
import { revalidate } from "@/lib/revalidate";

export const maxDuration = 60;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;

  const c = await db();
  const stmtRs = await c.execute("SELECT card_id FROM statements WHERE id = $1 AND user_id = $2", [id, userId]);
  if (!stmtRs.rows.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const cardId = stmtRs.rows[0].card_id as string;

  const quota = await aiState(c.execute, userId, cardId);
  if (!quota.configured) {
    return NextResponse.json({ error: "AI review is not configured on this deployment." }, { status: 400 });
  }
  if (quota.remaining <= 0) {
    return NextResponse.json(
      { error: `This card has used its ${quota.limit} AI reviews for the month. The limit resets on the 1st.`, ai: quota },
      { status: 429 }
    );
  }

  const txnRs = await c.execute(
    "SELECT id, description, category FROM transactions WHERE statement_id = $1 AND user_id = $2",
    [id, userId]
  );
  const rows = txnRs.rows.map((r) => ({
    id: r.id as string,
    description: r.description as string,
    category: r.category as string,
  }));
  if (!rows.length) return NextResponse.json({ error: "This statement has no transactions." }, { status: 400 });

  const suggested = await aiCategorize(rows);
  if (!suggested) {
    return NextResponse.json({ error: "AI review did not return a usable response. No quota was used.", ai: quota }, { status: 502 });
  }
  const ai = await consumeAi(c.execute, userId, cardId);

  const changes = rows.filter((r) => suggested.has(r.id) && suggested.get(r.id) !== r.category);
  if (changes.length) {
    await c.tx(async (q) => {
      for (const r of changes) {
        await q("UPDATE transactions SET category = $1 WHERE id = $2 AND user_id = $3", [
          suggested.get(r.id),
          r.id,
          userId,
        ]);
      }
      await revalidate(q, userId, id);
    });
  }

  return NextResponse.json({
    ok: true,
    changed: changes.length,
    reviewed: rows.length,
    changedIds: changes.map((r) => r.id),
    ai,
  });
}
