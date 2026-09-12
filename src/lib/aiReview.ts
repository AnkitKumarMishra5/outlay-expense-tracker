import { db } from "./db";
import { aiCategorize } from "./ai";
import { AiState, aiConfigured, aiState, releaseAi, reserveAi } from "./aiQuota";
import { revalidate } from "./revalidate";
import { loadRules } from "./categoryRules";

export interface AiChange {
  id: string;
  description: string;
  from: string;
  to: string;
}

export interface AiStatementResult {
  id: string;
  cardId: string;
  reviewed: number;
  changed: number;
  changes: AiChange[];
  /** Set when the statement was not sent to the model. */
  skipped?: "no-reviews-left" | "no-transactions";
}

export interface AiReviewResult {
  ok: boolean;
  /** Plain-language reason when nothing was reviewed. */
  error?: string;
  status?: number;
  statements: AiStatementResult[];
  cards: Record<string, AiState>;
}

/**
 * Review the categories of one or more saved statements in a single model
 * call. Each card involved spends one of its monthly reviews, taken before the
 * call and handed back only if the model was never reached.
 */
export async function reviewStatements(userId: string, statementIds: string[]): Promise<AiReviewResult> {
  // No count cap. What one request can reach is already bounded by the rows
  // it owns, the reviews its cards have left, and the chunk size in ai.ts.
  const ids = [...new Set(statementIds.filter((s) => typeof s === "string" && s.length <= 64))];
  if (!ids.length) return { ok: false, error: "Nothing to review.", status: 400, statements: [], cards: {} };
  if (!aiConfigured()) {
    return { ok: false, error: "AI review is not enabled on this deployment.", status: 400, statements: [], cards: {} };
  }

  const c = await db();
  const owned = await c.execute("SELECT id, card_id FROM statements WHERE user_id = $1 AND id = ANY($2::text[])", [userId, ids]);
  if (!owned.rows.length) return { ok: false, error: "Not found.", status: 404, statements: [], cards: {} };
  const cardOf = new Map(owned.rows.map((r) => [r.id as string, r.card_id as string]));

  // One reservation per card, all or nothing per card inside one transaction.
  const cards: Record<string, AiState> = {};
  const reserved = new Set<string>();
  await c.tx(async (q) => {
    for (const cardId of new Set(cardOf.values())) {
      const state = await reserveAi(q, userId, cardId);
      if (state) {
        reserved.add(cardId);
        cards[cardId] = state;
      } else {
        cards[cardId] = await aiState(q, userId, cardId);
      }
    }
  });

  const statements: AiStatementResult[] = [];
  const rows: { id: string; description: string; category: string; statementId: string }[] = [];
  for (const [id, cardId] of cardOf) {
    if (!reserved.has(cardId)) {
      statements.push({ id, cardId, reviewed: 0, changed: 0, changes: [], skipped: "no-reviews-left" });
      continue;
    }
    // Credits are Credits by their type, so only charges are worth asking about.
    const rs = await c.execute(
      "SELECT id, description, category FROM transactions WHERE statement_id = $1 AND user_id = $2 AND type = 'debit'",
      [id, userId]
    );
    if (!rs.rows.length) {
      statements.push({ id, cardId, reviewed: 0, changed: 0, changes: [], skipped: "no-transactions" });
      continue;
    }
    for (const r of rs.rows) {
      rows.push({ id: r.id as string, description: r.description as string, category: r.category as string, statementId: id });
    }
    statements.push({ id, cardId, reviewed: rs.rows.length, changed: 0, changes: [] });
  }

  if (!rows.length) {
    const allSpent = statements.every((s) => s.skipped === "no-reviews-left");
    if (reserved.size) await c.tx(async (q) => { for (const cardId of reserved) await releaseAi(q, userId, cardId); });
    for (const cardId of reserved) cards[cardId] = await aiState(c.execute, userId, cardId);
    return {
      ok: false,
      status: allSpent ? 429 : 400,
      error: allSpent
        ? "Every card here has already had its AI reviews for this month. They come back on the 1st."
        : "There are no transactions to review.",
      statements,
      cards,
    };
  }

  const outcome = await aiCategorize(rows, await loadRules(c.execute, userId));
  if (outcome.status !== "ok") {
    // Nothing came back, so nothing is charged. A model that answers badly is
    // not the reader's fault, and taking one of their two reviews for it would
    // punish them for someone else's bad day.
    await c.tx(async (q) => { for (const cardId of reserved) await releaseAi(q, userId, cardId); });
    for (const cardId of reserved) cards[cardId] = await aiState(c.execute, userId, cardId);
    return {
      ok: false,
      status: 502,
      error:
        outcome.status === "unreachable"
          ? "The AI service could not be reached, so your categories are unchanged. This did not use up a review."
          : "The AI answered in a way Outlay could not read, so your categories are unchanged. This did not use up a review.",
      statements,
      cards,
    };
  }

  const byStatement = new Map(statements.map((s) => [s.id, s]));
  const changes = rows
    .filter((r) => outcome.categories.has(r.id) && outcome.categories.get(r.id) !== r.category)
    .map((r) => ({ ...r, to: outcome.categories.get(r.id)! }));

  if (changes.length) {
    await c.tx(async (q) => {
      for (const r of changes) {
        await q("UPDATE transactions SET category = $1 WHERE id = $2 AND user_id = $3", [r.to, r.id, userId]);
      }
      for (const id of new Set(changes.map((r) => r.statementId))) await revalidate(q, userId, id);
    });
    for (const r of changes) {
      const s = byStatement.get(r.statementId)!;
      s.changed++;
      s.changes.push({ id: r.id, description: r.description, from: r.category, to: r.to });
    }
  }

  return { ok: true, statements, cards };
}
