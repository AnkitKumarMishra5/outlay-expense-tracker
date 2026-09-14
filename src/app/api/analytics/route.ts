import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Range, monthWindow, rangeStart, shiftMonth } from "@/lib/format";
import { currentUserId, unauthorized } from "@/lib/auth";
import { decryptOrNull } from "@/lib/crypto";
import { PAYMENT_PATTERN } from "@/lib/categories";

export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const params = req.nextUrl.searchParams;
  const cardId = params.get("cardId");
  const month = params.get("month");
  const range = (params.get("range") ?? "3m") as Range;
  const window = month && /^\d{4}-\d{2}$/.test(month) ? monthWindow(month) : null;
  const start = window ? window.start : rangeStart(range);

  // A transaction belongs to the month its statement was generated in: a
  // statement dated 12 August bills a cycle that opened on 13 July.
  const IN_MONTH = (pos: number) =>
    `statement_id IN (SELECT id FROM statements WHERE user_id = $1
       AND statement_month = $${pos})`;

  const args: string[] = [userId];
  const where = ["user_id = $1"];
  if (month && window) {
    args.push(month);
    where.push(IN_MONTH(args.length));
  } else if (start) {
    args.push(start);
    where.push(`txn_date >= $${args.length}`);
  }
  if (cardId) { args.push(cardId); where.push(`card_id = $${args.length}`); }
  const W = `WHERE ${where.join(" AND ")}`;

  const cardArgs: string[] = [userId];
  let joinWindow = "";
  if (month && window) {
    cardArgs.push(month);
    joinWindow = ` AND t.${IN_MONTH(cardArgs.length)}`;
  } else if (start) {
    cardArgs.push(start);
    joinWindow = ` AND t.txn_date >= $${cardArgs.length}`;
  }
  cardArgs.push(userId);
  const ownerPos = cardArgs.length;
  let cardFilter = "";
  if (cardId) { cardArgs.push(cardId); cardFilter = ` AND cards.id = $${cardArgs.length}`; }

  const joinArgs: string[] = [userId];
  const joinWhere = ["t.user_id = $1"];
  if (month && window) {
    joinArgs.push(month);
    joinWhere.push(`t.${IN_MONTH(joinArgs.length)}`);
  } else if (start) {
    joinArgs.push(start);
    joinWhere.push(`t.txn_date >= $${joinArgs.length}`);
  }
  if (cardId) { joinArgs.push(cardId); joinWhere.push(`t.card_id = $${joinArgs.length}`); }
  const JW = `WHERE ${joinWhere.join(" AND ")}`;

  const dueArgs: string[] = [userId];
  let dueFilter = "";
  if (cardId) { dueArgs.push(cardId); dueFilter = ` AND s.card_id = $${dueArgs.length}`; }


  const prev = month && window ? monthWindow(shiftMonth(month, -1)) : null;
  const prevArgs: string[] = [userId];
  const prevWhere = ["user_id = $1"];
  if (prev && month) {
    prevArgs.push(shiftMonth(month, -1));
    prevWhere.push(IN_MONTH(prevArgs.length));
  }
  if (cardId) { prevArgs.push(cardId); prevWhere.push(`card_id = $${prevArgs.length}`); }
  const PW = `WHERE ${prevWhere.join(" AND ")}`;

  const c = await db();
  const [totals, byCategory, byCard, biggest, dues, months, byCategoryPrev, feeRows] = await Promise.all([
    c.execute(
      `SELECT
         COALESCE(SUM(CASE WHEN type='debit' THEN amount END), 0) AS debits,
         COALESCE(SUM(CASE WHEN type='credit' THEN amount END), 0) AS credits,
         COALESCE(SUM(CASE WHEN type='credit' AND description ~* $${args.length + 1} THEN amount END), 0) AS payments,
         COALESCE(SUM(CASE WHEN type='debit' AND is_fee=1 THEN amount END), 0) AS fees,
         COUNT(*)::int AS txns,
         COUNT(*) FILTER (WHERE type='debit')::int AS spend_txns,
         COUNT(*) FILTER (WHERE type='credit')::int AS credit_txns
       FROM transactions ${W}`,
      [...args, PAYMENT_PATTERN]
    ),
    c.execute(
      `SELECT category, SUM(amount) AS total, COUNT(*)::int AS n
       FROM transactions ${W} AND type='debit' AND category != 'Credits'
       GROUP BY category ORDER BY total DESC`,
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
         -- The newest unpaid bill: its total already carries anything left on
         -- an older one, so that is what the card owes.
         ORDER BY s.due_date DESC
         LIMIT 1
       ) nd ON true
       WHERE cards.user_id = $${ownerPos}${cardFilter}
       GROUP BY cards.id, nd.due_date, nd.total_due
       ORDER BY debits DESC`,
      cardArgs
    ),
    c.execute(
      `SELECT t.id, t.txn_date, t.description, t.amount, t.category, t.is_fee, t.is_international,
              cards.card_label, cards.bank_id, cards.last4_enc
         FROM transactions t JOIN cards ON cards.id = t.card_id
         ${JW} AND t.type='debit'
        ORDER BY t.amount DESC, t.txn_date DESC LIMIT 10`,
      joinArgs
    ),
    c.execute(
      `SELECT s.id, s.card_id, s.due_date AS day, s.statement_date, s.statement_month, s.total_due AS amount, s.min_due AS min_due, s.paid_at,
         s.total_debits, s.txn_count,
         (s.paid_at IS NOT NULL OR COALESCE(s.total_due, 0) <= 0) AS settled,
         cards.card_label, cards.bank_id, cards.last4_enc
       FROM statements s JOIN cards ON cards.id = s.card_id
       WHERE s.user_id = $1 AND s.due_date IS NOT NULL${dueFilter}
       ORDER BY s.due_date`,
      dueArgs
    ),
    c.execute(
      `SELECT DISTINCT substr(txn_date,1,7) AS month FROM transactions WHERE user_id = $1
       UNION
       SELECT DISTINCT statement_month AS month
         FROM statements WHERE user_id = $1 AND statement_month IS NOT NULL
       ORDER BY month DESC`,
      [userId]
    ),
    prev
      ? c.execute(
          `SELECT category, SUM(amount) AS total
           FROM transactions ${PW} AND type='debit' AND category != 'Credits'
           GROUP BY category`,
          prevArgs
        )
      : Promise.resolve({ rows: [] as { [k: string]: unknown }[] }),
    c.execute(
      `SELECT t.txn_date, t.description, t.amount, cards.card_label
         FROM transactions t JOIN cards ON cards.id = t.card_id
         ${JW} AND t.is_fee = 1
        ORDER BY t.amount DESC LIMIT 20`,
      joinArgs
    ),
  ]);

  const reveal = (rows: { [k: string]: unknown }[]) =>
    rows.map((r) => ({ ...r, last4: decryptOrNull(r.last4_enc as string | null, userId), last4_enc: undefined }));

  return NextResponse.json({
    totals: totals.rows[0],
    byCategory: byCategory.rows,
    byCard: reveal(byCard.rows),
    biggest: reveal(biggest.rows),
    dues: reveal(dues.rows),
    months: months.rows.map((r) => r.month as string),
    byCategoryPrev: byCategoryPrev.rows,
    fees: feeRows.rows,
  });
}
