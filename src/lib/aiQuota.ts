import { Query } from "./db";

export const AI_MONTHLY_LIMIT = 2;

export interface AiState {
  configured: boolean;
  used: number;
  limit: number;
  remaining: number;
}

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function aiState(q: Query, userId: string, cardId: string): Promise<AiState> {
  const configured = aiConfigured();
  if (!configured) return { configured, used: 0, limit: AI_MONTHLY_LIMIT, remaining: 0 };
  const rs = await q("SELECT used FROM ai_usage WHERE user_id = $1 AND card_id = $2 AND month = $3", [
    userId,
    cardId,
    currentMonth(),
  ]);
  const used = rs.rows.length ? Number(rs.rows[0].used) : 0;
  return { configured, used, limit: AI_MONTHLY_LIMIT, remaining: Math.max(0, AI_MONTHLY_LIMIT - used) };
}

export async function consumeAi(q: Query, userId: string, cardId: string): Promise<AiState> {
  const rs = await q(
    `INSERT INTO ai_usage (user_id, card_id, month, used, updated_at)
     VALUES ($1, $2, $3, 1, $4)
     ON CONFLICT (user_id, card_id, month)
     DO UPDATE SET used = ai_usage.used + 1, updated_at = $4
     RETURNING used`,
    [userId, cardId, currentMonth(), new Date().toISOString()]
  );
  const used = Number(rs.rows[0].used);
  return { configured: true, used, limit: AI_MONTHLY_LIMIT, remaining: Math.max(0, AI_MONTHLY_LIMIT - used) };
}
