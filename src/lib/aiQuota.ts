import { Query } from "./db";

/** AI reviews each card gets per calendar month, spent when a statement is uploaded. */
export const AI_MONTHLY_LIMIT = 2;

/** Sweeps of every transaction a user gets per calendar month. */
export const AI_SWEEP_LIMIT = 2;

/** Stands in for a card in ai_usage when the run covers the whole account. */
export const SWEEP_SCOPE = "__sweep__";

export interface AiState {
  configured: boolean;
  used: number;
  limit: number;
  remaining: number;
}

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function aiState(
  q: Query,
  userId: string,
  cardId: string,
  limit = AI_MONTHLY_LIMIT
): Promise<AiState> {
  const configured = aiConfigured();
  if (!configured) return { configured, used: 0, limit, remaining: 0 };
  const rs = await q("SELECT used FROM ai_usage WHERE user_id = $1 AND card_id = $2 AND month = $3", [
    userId,
    cardId,
    currentMonth(),
  ]);
  const used = rs.rows.length ? Number(rs.rows[0].used) : 0;
  return { configured, used, limit, remaining: Math.max(0, limit - used) };
}

/** The account-wide sweep's own allowance, counted against the same table. */
export function sweepState(q: Query, userId: string): Promise<AiState> {
  return aiState(q, userId, SWEEP_SCOPE, AI_SWEEP_LIMIT);
}

export function reserveSweep(q: Query, userId: string): Promise<AiState | null> {
  return reserveAi(q, userId, SWEEP_SCOPE, AI_SWEEP_LIMIT);
}

export function releaseSweep(q: Query, userId: string): Promise<void> {
  return releaseAi(q, userId, SWEEP_SCOPE);
}

/**
 * Take one review for a card before the model is called. One statement does
 * the deciding and the incrementing together: the WHERE on the conflict
 * branch means a row comes back only if there was one left to take, so two
 * requests racing for a card's last review cannot both win. Returns null
 * when the card has none left.
 */
export async function reserveAi(
  q: Query,
  userId: string,
  cardId: string,
  limit = AI_MONTHLY_LIMIT
): Promise<AiState | null> {
  const rs = await q(
    `INSERT INTO ai_usage (user_id, card_id, month, used, updated_at)
     VALUES ($1, $2, $3, 1, $4)
     ON CONFLICT (user_id, card_id, month)
     DO UPDATE SET used = ai_usage.used + 1, updated_at = $4
     WHERE ai_usage.used < $5
     RETURNING used`,
    [userId, cardId, currentMonth(), new Date().toISOString(), limit]
  );
  if (!rs.rows.length) return null;
  const used = Number(rs.rows[0].used);
  return { configured: true, used, limit, remaining: Math.max(0, limit - used) };
}

/** Give a reservation back when the request never reached the model. */
export async function releaseAi(q: Query, userId: string, cardId: string): Promise<void> {
  await q(
    `UPDATE ai_usage SET used = GREATEST(used - 1, 0), updated_at = $4
     WHERE user_id = $1 AND card_id = $2 AND month = $3`,
    [userId, cardId, currentMonth(), new Date().toISOString()]
  );
}
