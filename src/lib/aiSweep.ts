import { db } from "./db";
import { aiCategorize } from "./ai";
import { AiState, aiConfigured, releaseSweep, reserveSweep, sweepState } from "./aiQuota";
import { SPEND_CATEGORIES } from "./categories";
import { revalidate } from "./revalidate";
import { loadRules } from "./categoryRules";
import { decryptOrNull } from "./crypto";

export interface AiProposal {
  id: string;
  description: string;
  amount: number;
  txnDate: string;
  from: string;
  to: string;
  cardLabel: string;
  bankId: string;
  last4: string | null;
}

export interface AiSweepResult {
  ok: boolean;
  error?: string;
  status?: number;
  reviewed: number;
  proposals: AiProposal[];
  ai: AiState;
}

/**
 * Read the charges on one statement month, or on every statement, and ask
 * the model what each one is.
 *
 * Nothing is written. The answer comes back as proposals for the reader to
 * accept, edit or throw away. A run touches the whole history at once, and
 * applying that silently would leave them with no way to tell what moved.
 */
export async function sweepAccount(userId: string, month: string | null = null): Promise<AiSweepResult> {
  const c = await db();
  const idle = await sweepState(c.execute, userId);
  if (!aiConfigured()) {
    return { ok: false, status: 400, error: "AI review is not enabled on this deployment.", reviewed: 0, proposals: [], ai: idle };
  }

  const reserved = await c.tx((q) => reserveSweep(q, userId));
  if (!reserved) {
    return {
      ok: false,
      status: 429,
      error: `You have used both AI recategorisations this month. They come back on the 1st.`,
      reviewed: 0,
      proposals: [],
      ai: idle,
    };
  }

  const give = async (): Promise<AiState> => {
    await c.tx((q) => releaseSweep(q, userId));
    return sweepState(c.execute, userId);
  };

  const rs = await c.execute(
    `SELECT t.id, t.description, t.category, t.amount, t.txn_date, t.statement_id,
            cards.card_label, cards.bank_id, cards.last4_enc
       FROM transactions t JOIN cards ON cards.id = t.card_id
      WHERE t.user_id = $1 AND t.type = 'debit'
        ${month ? `AND t.statement_id IN (SELECT id FROM statements WHERE user_id = $1
               AND substr(COALESCE(statement_date, period_end, due_date), 1, 7) = $2)` : ""}
      ORDER BY t.txn_date DESC`,
    month ? [userId, month] : [userId]
  );
  if (!rs.rows.length) {
    const error = month ? "There are no spends on that statement to review." : "There are no spends to review.";
    return { ok: false, status: 400, error, reviewed: 0, proposals: [], ai: await give() };
  }

  const rows = rs.rows.map((r) => ({
    id: r.id as string,
    description: r.description as string,
    category: r.category as string,
  }));
  const outcome = await aiCategorize(rows, await loadRules(c.execute, userId));
  if (outcome.status !== "ok") {
    return {
      ok: false,
      status: 502,
      error:
        outcome.status === "unreachable"
          ? "The AI service could not be reached, so nothing changed. This did not use up a run."
          : "The AI answered in a way Outlay could not read, so nothing changed. This did not use up a run.",
      reviewed: rows.length,
      proposals: [],
      ai: await give(),
    };
  }

  const proposals: AiProposal[] = [];
  for (const r of rs.rows) {
    const id = r.id as string;
    const to = outcome.categories.get(id);
    if (!to || to === r.category) continue;
    proposals.push({
      id,
      description: r.description as string,
      amount: Number(r.amount),
      txnDate: r.txn_date as string,
      from: r.category as string,
      to,
      cardLabel: r.card_label as string,
      bankId: r.bank_id as string,
      last4: decryptOrNull(r.last4_enc as string | null, userId),
    });
  }

  return { ok: true, reviewed: rows.length, proposals, ai: await sweepState(c.execute, userId) };
}

/** Write the changes the reader approved. The sweep was already paid for. */
export async function applySweep(
  userId: string,
  changes: { id: string; category: string }[]
): Promise<{ applied: number }> {
  const valid = changes.filter(
    (ch) => typeof ch.id === "string" && ch.id.length <= 64 && (SPEND_CATEGORIES as readonly string[]).includes(ch.category)
  );
  if (!valid.length) return { applied: 0 };

  const c = await db();
  const ids = valid.map((ch) => ch.id);
  const owned = await c.execute(
    "SELECT id, statement_id FROM transactions WHERE user_id = $1 AND type = 'debit' AND id = ANY($2::text[])",
    [userId, ids]
  );
  const statementOf = new Map(owned.rows.map((r) => [r.id as string, r.statement_id as string]));

  const applicable = valid.filter((ch) => statementOf.has(ch.id));
  if (!applicable.length) return { applied: 0 };

  await c.tx(async (q) => {
    for (const ch of applicable) {
      await q("UPDATE transactions SET category = $1 WHERE id = $2 AND user_id = $3", [ch.category, ch.id, userId]);
    }
    for (const sid of new Set(applicable.map((ch) => statementOf.get(ch.id)!))) {
      await revalidate(q, userId, sid);
    }
  });

  return { applied: applicable.length };
}
