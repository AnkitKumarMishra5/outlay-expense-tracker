import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { decryptOrNull } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const c = await db();
  const [cards, statements, transactions] = await Promise.all([
    c.execute("SELECT id, bank_id, bank_name, card_label, last4_enc, first4_enc, created_at FROM cards WHERE user_id = $1", [userId]),
    c.execute("SELECT id, card_id, period_start, period_end, statement_date, due_date, total_due, min_due, total_debits, total_credits, txn_count, checks_json, parser, created_at FROM statements WHERE user_id = $1", [userId]),
    c.execute("SELECT id, statement_id, card_id, txn_date, description, amount, type, category, is_fee, is_international FROM transactions WHERE user_id = $1", [userId]),
  ]);
  return new NextResponse(
    JSON.stringify({ exportedAt: new Date().toISOString(), cards: cards.rows.map((r) => ({
        ...r,
        last4: decryptOrNull(r.last4_enc as string | null, userId),
        first4: decryptOrNull(r.first4_enc as string | null, userId),
        last4_enc: undefined,
        first4_enc: undefined,
      })), statements: statements.rows, transactions: transactions.rows }, null, 2),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="outlay-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    }
  );
}
