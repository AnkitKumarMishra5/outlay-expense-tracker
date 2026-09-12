import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { decryptOrNull } from "@/lib/crypto";

const PAGE = 50;

/** Paying the card back. Everything else a card credits is a refund. */
const PAYMENT_RE = "payment received|payment thank|cc payment|card payment|bbps|autopay|neft|imps|upi credit|payment - ";

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
  // A month always means the month a statement was generated in.
  const month = p.get("month");
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    add(
      `t.statement_id IN (SELECT id FROM statements WHERE user_id = $1
         AND substr(COALESCE(statement_date, period_end, due_date), 1, 7) = $?)`,
      month
    );
  }
  const from = p.get("from");
  if (from) add("t.txn_date >= $?", from);
  const to = p.get("to");
  if (to) add("t.txn_date <= $?", to);

  const W = `WHERE ${where.join(" AND ")}`;
  const offset = Math.max(0, Number(p.get("offset") ?? 0) || 0);

  const c = await db();
  const [rows, totals, statementMonths] = await Promise.all([
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
      // Two buckets only: money paid back to the card, and everything else
      // the card credited.
      `SELECT COUNT(*)::int AS n,
              COALESCE(SUM(CASE WHEN t.type='debit' THEN t.amount END), 0) AS debits,
              COALESCE(SUM(CASE WHEN t.type='credit' THEN t.amount END), 0) AS credits,
              COALESCE(SUM(CASE WHEN t.type='credit' AND t.description ~* $${args.length + 1} THEN t.amount END), 0) AS payments
       FROM transactions t ${W}`,
      [...args, PAYMENT_RE]
    ),
    c.execute(
      `SELECT DISTINCT substr(COALESCE(statement_date, period_end, due_date), 1, 7) AS month
         FROM statements
        WHERE user_id = $1 AND COALESCE(statement_date, period_end, due_date) IS NOT NULL
        ORDER BY month DESC`,
      [userId]
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
    payments: Number(totals.rows[0].payments),
    months: statementMonths.rows.map((r) => r.month as string),
  });
}
