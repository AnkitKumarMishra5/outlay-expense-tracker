import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Range, rangeStart } from "@/lib/format";
import { currentUserId, unauthorized } from "@/lib/auth";
import { decryptOrNull } from "@/lib/crypto";
import { detectSubscriptions } from "@/lib/subscriptions";

export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const params = req.nextUrl.searchParams;
  const range = (params.get("range") ?? "3m") as Range;
  const cardId = params.get("cardId");

  const start = rangeStart(range);

  const args: string[] = [userId];
  const where = ["user_id = $1"];
  if (start) { args.push(start); where.push(`txn_date >= $${args.length}`); }
  if (cardId) { args.push(cardId); where.push(`card_id = $${args.length}`); }
  const W = `WHERE ${where.join(" AND ")}`;

  const cardArgs: string[] = [userId];
  let joinWindow = "";
  if (start) { cardArgs.push(start); joinWindow = ` AND t.txn_date >= $${cardArgs.length}`; }
  cardArgs.push(userId);
  const ownerPos = cardArgs.length;
  let cardFilter = "";
  if (cardId) { cardArgs.push(cardId); cardFilter = ` AND cards.id = $${cardArgs.length}`; }

  const joinArgs: string[] = [userId];
  const joinWhere = ["t.user_id = $1"];
  if (start) { joinArgs.push(start); joinWhere.push(`t.txn_date >= $${joinArgs.length}`); }
  if (cardId) { joinArgs.push(cardId); joinWhere.push(`t.card_id = $${joinArgs.length}`); }
  const JW = `WHERE ${joinWhere.join(" AND ")}`;

  const dueArgs: string[] = [userId];
  let dueFilter = "";
  if (cardId) { dueArgs.push(cardId); dueFilter = ` AND s.card_id = $${dueArgs.length}`; }

  const c = await db();
  const [recurringRows] = await Promise.all([
    c.execute(
      `SELECT t.txn_date, t.description, t.amount, cards.id AS card_id, cards.card_label, cards.bank_id, cards.last4_enc
       FROM transactions t JOIN cards ON cards.id = t.card_id
       WHERE t.user_id = $1 AND t.type = 'debit' AND t.category <> 'Payments & Refunds'
       ORDER BY t.txn_date`,
      [userId]
    ),
  ]);
  const subscriptions = detectSubscriptions(
    recurringRows.rows.map((r) => ({
      cardId: r.card_id as string,
      cardLabel: r.card_label as string,
      bankId: r.bank_id as string,
      last4: decryptOrNull(r.last4_enc as string | null, userId),
      date: r.txn_date as string,
      description: r.description as string,
      amount: Number(r.amount),
    }))
  );

  const [totals, byMonth, byCategory, byMerchant, byCard, recent, byDay, dayCards, dues] = await Promise.all([
    c.execute(
      `SELECT
         COALESCE(SUM(CASE WHEN type='debit' THEN amount END), 0) AS debits,
         COALESCE(SUM(CASE WHEN type='credit' THEN amount END), 0) AS credits,
         COALESCE(SUM(CASE WHEN type='debit' AND is_fee=1 THEN amount END), 0) AS fees,
         COUNT(*)::int AS txns
       FROM transactions ${W}`,
      args
    ),
    c.execute(
      `SELECT substr(txn_date,1,7) AS month,
         COALESCE(SUM(CASE WHEN type='debit' THEN amount END), 0) AS debits
       FROM transactions ${W} GROUP BY month ORDER BY month`,
      args
    ),
    c.execute(
      `SELECT category, SUM(amount) AS total, COUNT(*)::int AS n
       FROM transactions ${W} AND type='debit' AND category != 'Payments & Refunds'
       GROUP BY category ORDER BY total DESC`,
      args
    ),
    c.execute(
      // Merchants, not categories. "Shopping" does not tell you it was Amazon.
      // Descriptions carry reference numbers and city names, so they are
      // trimmed to their leading words before grouping.
      `SELECT merchant, SUM(amount) AS total, COUNT(*)::int AS n,
              (ARRAY_AGG(category ORDER BY amount DESC))[1] AS category
         FROM (
           SELECT amount, category,
                  UPPER(ARRAY_TO_STRING((STRING_TO_ARRAY(REGEXP_REPLACE(description, '[^A-Za-z ]+', ' ', 'g'), ' '))[1:2], ' ')) AS merchant
             FROM transactions ${W} AND type='debit' AND category != 'Payments & Refunds'
         ) m
        WHERE LENGTH(TRIM(merchant)) > 2
        GROUP BY merchant ORDER BY total DESC LIMIT 8`,
      args
    ),
    c.execute(
      `SELECT cards.id AS card_id, cards.card_label, cards.bank_id, cards.bank_name, cards.last4_enc,
         COALESCE(SUM(CASE WHEN t.type='debit' THEN t.amount END), 0) AS debits,
         COUNT(t.id)::int AS txns,
         nd.due_date AS next_due, nd.total_due AS next_due_amount
       FROM cards
       LEFT JOIN transactions t
         ON t.card_id = cards.id AND t.user_id = $1${joinWindow}
       LEFT JOIN LATERAL (
         SELECT s.due_date, s.total_due
         FROM statements s
         WHERE s.card_id = cards.id AND s.user_id = cards.user_id
           AND s.paid_at IS NULL AND COALESCE(s.total_due, 0) > 0
         ORDER BY s.due_date
         LIMIT 1
       ) nd ON true
       WHERE cards.user_id = $${ownerPos}${cardFilter}
       GROUP BY cards.id, nd.due_date, nd.total_due
       ORDER BY debits DESC`,
      cardArgs
    ),
    c.execute(
      `SELECT id, txn_date, description, amount, type, category, is_fee
       FROM transactions ${W} ORDER BY txn_date DESC, created_at DESC LIMIT 8`,
      args
    ),
    c.execute(
      `SELECT txn_date AS day,
         COALESCE(SUM(CASE WHEN type='debit' THEN amount END), 0) AS debits,
         COUNT(*)::int AS txns
       FROM transactions ${W} AND type='debit'
       GROUP BY txn_date ORDER BY day`,
      args
    ),
    c.execute(
      `SELECT t.txn_date AS day, cards.id AS card_id, cards.card_label, cards.bank_id, cards.last4_enc,
         SUM(t.amount) AS debits, COUNT(*)::int AS txns
       FROM transactions t JOIN cards ON cards.id = t.card_id
       ${JW} AND t.type='debit'
       GROUP BY t.txn_date, cards.id
       ORDER BY t.txn_date, debits DESC`,
      joinArgs
    ),
    c.execute(
      `SELECT s.id, s.card_id, s.due_date AS day, s.statement_date, s.total_due AS amount, s.min_due AS min_due, s.paid_at,
         (s.paid_at IS NOT NULL OR COALESCE(s.total_due, 0) <= 0) AS settled,
         cards.card_label, cards.bank_id, cards.last4_enc
       FROM statements s JOIN cards ON cards.id = s.card_id
       WHERE s.user_id = $1 AND s.due_date IS NOT NULL${dueFilter}
       ORDER BY s.due_date`,
      dueArgs
    ),
  ]);

  const reveal = (rows: { [k: string]: unknown }[]) =>
    rows.map((r) => ({ ...r, last4: decryptOrNull(r.last4_enc as string | null, userId), last4_enc: undefined }));

  return NextResponse.json({
    totals: totals.rows[0],
    byMonth: byMonth.rows,
    byCategory: byCategory.rows,
    byMerchant: byMerchant.rows,
    byCard: reveal(byCard.rows),
    subscriptions,
    recent: recent.rows,
    byDay: byDay.rows,
    dayCards: reveal(dayCards.rows),
    dues: reveal(dues.rows),
  });
}
