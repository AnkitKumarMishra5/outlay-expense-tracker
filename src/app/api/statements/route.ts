import { NextRequest, NextResponse } from "next/server";
import { db, now, uid } from "@/lib/db";
import { ParsedTxn, Check, StatementSummary } from "@/lib/types";
import { currentUserId, unauthorized } from "@/lib/auth";
import { decryptOrNull } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const c = await db();
  const rs = await c.execute(`SELECT s.*, cards.card_label, cards.bank_id, cards.bank_name, cards.last4_enc
     FROM statements s JOIN cards ON cards.id = s.card_id
     WHERE s.user_id = $1
     ORDER BY COALESCE(s.period_end, s.created_at) DESC`, [userId]);
  return NextResponse.json({
    statements: rs.rows.map((r) => ({
      ...r,
      last4: decryptOrNull(r.last4_enc as string | null, userId),
      last4_enc: undefined,
    })),
  });
}

interface SaveBody {
  cardId: string;
  filename: string;
  parser: string;
  summary: StatementSummary;
  transactions: ParsedTxn[];
  checks: Check[];
  paid?: boolean;
}

export async function POST(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const body = (await req.json()) as SaveBody;
  if (!body.cardId || !Array.isArray(body.transactions) || body.transactions.length === 0) {
    return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  }
  const c = await db();
  const cardRs = await c.execute("SELECT id FROM cards WHERE id = $1 AND user_id = $2", [body.cardId, userId]);
  if (cardRs.rows.length === 0) return NextResponse.json({ error: "Unknown card." }, { status: 404 });

  const s = body.summary ?? {};
  // Not every issuer prints a billing period, so fall through to the dates.
  const clash = s.periodEnd
    ? await c.execute(
        `SELECT id FROM statements
         WHERE user_id = $1 AND card_id = $2 AND period_end = $3
           AND period_start IS NOT DISTINCT FROM $4`,
        [userId, body.cardId, s.periodEnd, s.periodStart ?? null]
      )
    : s.statementDate
      ? await c.execute(
          "SELECT id FROM statements WHERE user_id = $1 AND card_id = $2 AND statement_date = $3",
          [userId, body.cardId, s.statementDate]
        )
      : s.dueDate
        ? await c.execute(
            `SELECT id FROM statements
             WHERE user_id = $1 AND card_id = $2 AND due_date = $3
               AND total_due IS NOT DISTINCT FROM $4`,
            [userId, body.cardId, s.dueDate, s.totalDue ?? null]
          )
        : null;
  if (clash?.rows.length) {
    const which = s.periodEnd
      ? `ending ${s.periodEnd}`
      : s.statementDate
        ? `dated ${s.statementDate}`
        : `due ${s.dueDate}`;
    return NextResponse.json(
      { error: `A statement ${which} is already saved for this card. Delete that one first to replace it.` },
      { status: 409 }
    );
  }

  const txns = body.transactions.filter(
    (t) => /^\d{4}-\d{2}-\d{2}$/.test(t.date) && t.amount > 0 && (t.type === "debit" || t.type === "credit")
  );
  const sum = (type: string) =>
    Math.round(txns.filter((t) => t.type === type).reduce((a, t) => a + t.amount, 0) * 100) / 100;

  const stmtId = uid();
  const ts = now();
  await c.tx(async (q) => {
    await q(
      `INSERT INTO statements (id, user_id, card_id, period_start, period_end, statement_date, due_date,
         total_due, min_due, total_debits, total_credits, stated_debits, stated_credits, previous_balance,
         txn_count, checks_json, paid_at, filename, parser, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        stmtId, userId, body.cardId, s.periodStart ?? null, s.periodEnd ?? null, s.statementDate ?? null,
        s.dueDate ?? null, s.totalDue ?? null, s.minDue ?? null, sum("debit"), sum("credit"),
        s.statedDebits ?? null, s.statedCredits ?? null, s.previousBalance ?? null,
        txns.length, JSON.stringify(body.checks ?? []), body.paid ? ts : null,
        String(body.filename ?? "").slice(0, 120),
        "heuristic", ts,
      ]
    );
    for (const t of txns) {
      await q(
        `INSERT INTO transactions (id, user_id, statement_id, card_id, txn_date, description, amount, type, category, is_fee, is_international, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          uid(), userId, stmtId, body.cardId, t.date,
          t.description.slice(0, 200), t.amount, t.type,
          t.category ?? "Other", t.isFee ? 1 : 0, t.isInternational ? 1 : 0, ts,
        ]
      );
    }
  });

  return NextResponse.json({ ok: true, id: stmtId });
}
