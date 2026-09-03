import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { decryptOrNull } from "@/lib/crypto";

const PAGE = 50;

export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const p = req.nextUrl.searchParams;

  const args: unknown[] = [userId];
  const where = ["t.user_id = $1"];
  const add = (clause: string, value: unknown) => {
    args.push(value);
    where.push(clause.replace("$?", `$${args.length}`));
  };

  const statementId = p.get("statementId");
  if (statementId) add("t.statement_id = $?", statementId);
  const cardId = p.get("cardId");
  if (cardId) add("t.card_id = $?", cardId);
  const category = p.get("category");
  if (category) add("t.category = $?", category);
  const type = p.get("type");
  if (type === "debit" || type === "credit") add("t.type = $?", type);
  const q = p.get("q")?.trim();
  if (q) add("t.description ILIKE $?", `%${q}%`);
  const from = p.get("from");
  if (from) add("t.txn_date >= $?", from);
  const to = p.get("to");
  if (to) add("t.txn_date <= $?", to);

  const W = `WHERE ${where.join(" AND ")}`;
  const offset = Math.max(0, Number(p.get("offset") ?? 0) || 0);

  const c = await db();
  const [rows, totals] = await Promise.all([
    c.execute(
      `SELECT t.id, t.txn_date, t.description, t.amount, t.type, t.category, t.is_fee,
              t.is_international, t.statement_id,
              cards.id AS card_id, cards.card_label, cards.bank_id, cards.bank_name, cards.last4_enc
       FROM transactions t JOIN cards ON cards.id = t.card_id
       ${W}
       ORDER BY t.txn_date DESC, t.created_at DESC
       LIMIT ${PAGE + 1} OFFSET ${offset}`,
      args
    ),
    c.execute(
      `SELECT COUNT(*)::int AS n,
              COALESCE(SUM(CASE WHEN t.type='debit' THEN t.amount END), 0) AS debits,
              COALESCE(SUM(CASE WHEN t.type='credit' THEN t.amount END), 0) AS credits
       FROM transactions t ${W}`,
      args
    ),
  ]);

  const page = rows.rows.slice(0, PAGE).map((r) => ({
    ...r,
    last4: decryptOrNull(r.last4_enc as string | null, userId),
    last4_enc: undefined,
  }));

  return NextResponse.json({
    transactions: page,
    more: rows.rows.length > PAGE,
    offset,
    total: Number(totals.rows[0].n),
    debits: Number(totals.rows[0].debits),
    credits: Number(totals.rows[0].credits),
  });
}
