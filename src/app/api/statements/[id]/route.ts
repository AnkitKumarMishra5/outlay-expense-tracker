import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { revalidate } from "@/lib/revalidate";
import { decryptOrNull } from "@/lib/crypto";
import { aiState } from "@/lib/aiQuota";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const c = await db();
  const stmt = await c.execute(`SELECT s.*, cards.card_label, cards.bank_id, cards.bank_name, cards.last4_enc
          FROM statements s JOIN cards ON cards.id = s.card_id WHERE s.id = $1 AND s.user_id = $2`, [id, userId]);
  if (stmt.rows.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const txns = await c.execute("SELECT * FROM transactions WHERE statement_id = $1 AND user_id = $2 ORDER BY txn_date, description", [id, userId]);
  const statement = {
    ...stmt.rows[0],
    last4: decryptOrNull(stmt.rows[0].last4_enc as string | null, userId),
    last4_enc: undefined,
  };
  const ai = await aiState(c.execute, userId, stmt.rows[0].card_id as string);
  return NextResponse.json({ statement, transactions: txns.rows, ai });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (typeof body.paid !== "boolean") {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }
  const c = await db();
  // Settling changes the answer to "is this overdue", so the stored check
  // record is rebuilt in the same transaction as the flag itself.
  const affected = await c.tx(async (q) => {
    const res = await q("UPDATE statements SET paid_at = $1 WHERE id = $2 AND user_id = $3", [
      body.paid ? new Date().toISOString() : null,
      id,
      userId,
    ]);
    if (res.rowsAffected) await revalidate(q, userId, id);
    return res.rowsAffected;
  });
  if (!affected) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true, paid: body.paid });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const c = await db();
  const res = await c.execute("DELETE FROM statements WHERE id = $1 AND user_id = $2", [id, userId]);
  if (!res.rowsAffected) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
