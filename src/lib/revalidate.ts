import { Query } from "./db";
import { runChecks, PriorStatementInfo } from "./checks";
import { ParsedTxn } from "./types";

export async function revalidate(q: Query, userId: string, statementId: string) {
  const stmtRs = await q(
    `SELECT card_id, period_start, period_end, statement_date, due_date,
            total_due, min_due, stated_debits, stated_credits, previous_balance, parser, paid_at
     FROM statements WHERE id = $1 AND user_id = $2`,
    [statementId, userId]
  );
  const stmt = stmtRs.rows[0];
  if (!stmt) return;

  const rows = await q(
    `SELECT txn_date, description, amount, type, category, is_fee, is_international
     FROM transactions WHERE statement_id = $1 AND user_id = $2 ORDER BY txn_date`,
    [statementId, userId]
  );

  const txns: ParsedTxn[] = rows.rows.map((r) => ({
    date: r.txn_date as string,
    description: r.description as string,
    amount: Number(r.amount),
    type: r.type as "debit" | "credit",
    category: r.category as string,
    isFee: Number(r.is_fee) === 1,
    isInternational: Number(r.is_international) === 1,
  }));

  const round = (n: number) => Math.round(n * 100) / 100;
  const debits = round(txns.filter((t) => t.type === "debit").reduce((a, t) => a + t.amount, 0));
  const credits = round(txns.filter((t) => t.type === "credit").reduce((a, t) => a + t.amount, 0));

  const priorRs = await q(
    `SELECT period_start, period_end, statement_date, due_date, total_due FROM statements
     WHERE card_id = $1 AND user_id = $2 AND id <> $3`,
    [stmt.card_id, userId, statementId]
  );
  const priors: PriorStatementInfo[] = priorRs.rows.map((r) => ({
    periodStart: r.period_start as string | null,
    periodEnd: r.period_end as string | null,
    statementDate: r.statement_date as string | null,
    dueDate: r.due_date as string | null,
    totalDue: r.total_due != null ? Number(r.total_due) : null,
  }));

  const checks = runChecks(
    {
      parser: "heuristic",
      summary: {
        periodStart: (stmt.period_start as string) ?? undefined,
        periodEnd: (stmt.period_end as string) ?? undefined,
        statementDate: (stmt.statement_date as string) ?? undefined,
        dueDate: (stmt.due_date as string) ?? undefined,
        totalDue: stmt.total_due != null ? Number(stmt.total_due) : undefined,
        minDue: stmt.min_due != null ? Number(stmt.min_due) : undefined,
        statedDebits: stmt.stated_debits != null ? Number(stmt.stated_debits) : undefined,
        statedCredits: stmt.stated_credits != null ? Number(stmt.stated_credits) : undefined,
        previousBalance: stmt.previous_balance != null ? Number(stmt.previous_balance) : undefined,
      },
      transactions: txns,
    },
    priors,
    stmt.paid_at as string | null
  );

  await q(
    `UPDATE statements SET total_debits = $1, total_credits = $2, txn_count = $3, checks_json = $4
     WHERE id = $5 AND user_id = $6`,
    [debits, credits, txns.length, JSON.stringify(checks), statementId, userId]
  );
}
