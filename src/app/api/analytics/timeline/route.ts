import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monthWindow } from "@/lib/format";
import { currentUserId, unauthorized } from "@/lib/auth";
import { decryptOrNull } from "@/lib/crypto";
import { detectSubscriptions } from "@/lib/subscriptions";

/**
 * The parts of the dashboard that read across months.
 *
 * These are the expensive queries (recurring detection walks every debit the
 * account has ever had) and none of them answer anything above the fold, so
 * they load on their own and the rest of the page does not wait for them.
 */
export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const params = req.nextUrl.searchParams;
  const cardId = params.get("cardId");
  const month = params.get("month");
  const window = month && /^\d{4}-\d{2}$/.test(month) ? monthWindow(month) : null;

  const IN_MONTH = (pos: number) =>
    `statement_id IN (SELECT id FROM statements WHERE user_id = $1
       AND substr(COALESCE(statement_date, period_end, due_date), 1, 7) = $${pos})`;

  const dayArgs: string[] = [userId];
  const dayWhere = ["t.user_id = $1"];
  if (window && month) {
    dayArgs.push(month);
    dayWhere.push(`t.${IN_MONTH(dayArgs.length)}`);
  }
  if (cardId) { dayArgs.push(cardId); dayWhere.push(`t.card_id = $${dayArgs.length}`); }
  const DW = `WHERE ${dayWhere.join(" AND ")}`;

  const trendArgs: string[] = [userId];
  const trendWhere = ["user_id = $1"];
  if (cardId) { trendArgs.push(cardId); trendWhere.push(`card_id = $${trendArgs.length}`); }
  const TW = `WHERE ${trendWhere.join(" AND ")}`;

  const c = await db();
  const [byMonth, byStatementMonth, byCategoryMonth, byCategoryStatementMonth, byDay, dayCards, recurringRows] = await Promise.all([
    c.execute(
      `SELECT substr(txn_date,1,7) AS month,
         COALESCE(SUM(CASE WHEN type='debit' THEN amount END), 0) AS debits
       FROM transactions ${TW} GROUP BY month ORDER BY month`,
      trendArgs
    ),
    c.execute(
      `SELECT substr(COALESCE(s.statement_date, s.period_end, s.due_date), 1, 7) AS month,
         COALESCE(SUM(CASE WHEN t.type='debit' THEN t.amount END), 0) AS debits
       FROM transactions t JOIN statements s ON s.id = t.statement_id
       ${TW.replace("user_id", "t.user_id").replace("card_id", "t.card_id")}
         AND COALESCE(s.statement_date, s.period_end, s.due_date) IS NOT NULL
       GROUP BY month ORDER BY month`,
      trendArgs
    ),
    c.execute(
      `SELECT substr(txn_date,1,7) AS month, category, SUM(amount) AS debits
       FROM transactions ${TW} AND type='debit' AND category != 'Payments & Refunds'
       GROUP BY month, category ORDER BY month`,
      trendArgs
    ),
    c.execute(
      `SELECT substr(COALESCE(s.statement_date, s.period_end, s.due_date), 1, 7) AS month,
         t.category, SUM(t.amount) AS debits
       FROM transactions t JOIN statements s ON s.id = t.statement_id
       ${TW.replace("user_id", "t.user_id").replace("card_id", "t.card_id")}
         AND t.type='debit' AND t.category != 'Payments & Refunds'
         AND COALESCE(s.statement_date, s.period_end, s.due_date) IS NOT NULL
       GROUP BY month, t.category ORDER BY month`,
      trendArgs
    ),
    c.execute(
      `SELECT t.txn_date AS day,
         COALESCE(SUM(t.amount), 0) AS debits,
         COUNT(*)::int AS txns
       FROM transactions t ${DW} AND t.type='debit'
       GROUP BY t.txn_date ORDER BY day`,
      dayArgs
    ),
    c.execute(
      `SELECT t.txn_date AS day, cards.id AS card_id, cards.card_label, cards.bank_id, cards.last4_enc,
         SUM(t.amount) AS debits, COUNT(*)::int AS txns
       FROM transactions t JOIN cards ON cards.id = t.card_id
       ${DW} AND t.type='debit'
       GROUP BY t.txn_date, cards.id
       ORDER BY t.txn_date, debits DESC`,
      dayArgs
    ),
    c.execute(
      `SELECT t.txn_date, t.description, t.amount, cards.id AS card_id, cards.card_label, cards.bank_id, cards.last4_enc
       FROM transactions t JOIN cards ON cards.id = t.card_id
       WHERE t.user_id = $1 AND t.type = 'debit' AND t.category <> 'Payments & Refunds'
       ORDER BY t.txn_date`,
      [userId]
    ),
  ]);

  const reveal = (rows: { [k: string]: unknown }[]) =>
    rows.map((r) => ({ ...r, last4: decryptOrNull(r.last4_enc as string | null, userId), last4_enc: undefined }));

  return NextResponse.json({
    byMonth: byMonth.rows,
    byStatementMonth: byStatementMonth.rows,
    byCategoryMonth: byCategoryMonth.rows,
    byCategoryStatementMonth: byCategoryStatementMonth.rows,
    byDay: byDay.rows,
    dayCards: reveal(dayCards.rows),
    subscriptions: detectSubscriptions(
      recurringRows.rows.map((r) => ({
        cardId: r.card_id as string,
        cardLabel: r.card_label as string,
        bankId: r.bank_id as string,
        last4: decryptOrNull(r.last4_enc as string | null, userId),
        date: r.txn_date as string,
        description: r.description as string,
        amount: Number(r.amount),
      }))
    ),
  });
}
