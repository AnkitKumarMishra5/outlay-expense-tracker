import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { revalidate } from "@/lib/revalidate";
import { decryptOrNull } from "@/lib/crypto";
import { aiState } from "@/lib/aiQuota";
import { parseReviewed } from "@/lib/checks";
import type { Check } from "@/lib/types";

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
  const review = body.review;
  if (review && typeof review.checkId === "string" && typeof review.reviewed === "boolean") {
    return markReviewed(userId, id, review.checkId, review.reviewed);
  }
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

/**
 * Marks one warning or failure as looked at, or takes the mark back. The mark
 * holds the finding's wording at the time, so if an edit changes what the
 * check says, it shows again.
 */
async function markReviewed(userId: string, id: string, checkId: string, reviewed: boolean) {
  const c = await db();
  const result = await c.tx(async (q) => {
    const rs = await q("SELECT checks_json, reviewed_checks FROM statements WHERE id = $1 AND user_id = $2 FOR UPDATE", [id, userId]);
    if (!rs.rows.length) return "missing" as const;
    const checks: Check[] = JSON.parse((rs.rows[0].checks_json as string) || "[]");
    const marks = parseReviewed(rs.rows[0].reviewed_checks as string);
    const current = Object.fromEntries(
      checks.filter((k) => k.status !== "pass" && marks[k.id] === k.detail).map((k) => [k.id, k.detail])
    );
    const check = checks.find((k) => k.id === checkId);
    if (reviewed) {
      if (!check || check.status === "pass") return "stale" as const;
      current[check.id] = check.detail;
    } else {
      delete current[checkId];
    }
    await q("UPDATE statements SET reviewed_checks = $1 WHERE id = $2 AND user_id = $3", [JSON.stringify(current), id, userId]);
    return "ok" as const;
  });
  if (result === "missing") return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (result === "stale") return NextResponse.json({ error: "That check has changed. Reload and look again." }, { status: 409 });
  return NextResponse.json({ ok: true });
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
