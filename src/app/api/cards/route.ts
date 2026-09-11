import { NextRequest, NextResponse } from "next/server";
import { db, now, uid } from "@/lib/db";
import { encrypt, decryptOrNull } from "@/lib/crypto";
import { bankById } from "@/lib/banks";
import { currentUserId, unauthorized } from "@/lib/auth";
import { AI_MONTHLY_LIMIT, aiConfigured, currentMonth } from "@/lib/aiQuota";

export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const c = await db();
  const rs = await c.execute(
    `SELECT cards.id, cards.bank_id, cards.bank_name, cards.card_label, cards.last4_enc, cards.first4_enc,
            CASE WHEN cards.password_enc IS NULL THEN 0 ELSE 1 END AS has_password, cards.created_at,
            COALESCE(ai_usage.used, 0) AS ai_used
       FROM cards
       LEFT JOIN ai_usage ON ai_usage.card_id = cards.id AND ai_usage.user_id = cards.user_id AND ai_usage.month = $2
      WHERE cards.user_id = $1 ORDER BY cards.created_at`,
    [userId, currentMonth()]
  );
  return NextResponse.json({
    cards: rs.rows.map((r) => ({
      ...r,
      ai_used: Number(r.ai_used),
      last4: decryptOrNull(r.last4_enc as string | null, userId),
      first4: decryptOrNull(r.first4_enc as string | null, userId),
      last4_enc: undefined,
      first4_enc: undefined,
    })),
    ai: { configured: aiConfigured(), limit: AI_MONTHLY_LIMIT },
  });
}

export async function POST(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const { bankId, cardLabel, last4, first4, customPassword } = await req.json();
  const bank = bankById(bankId);
  if (!bankId || typeof cardLabel !== "string" || !cardLabel.trim()) {
    return NextResponse.json({ error: "Bank and card name are required." }, { status: 400 });
  }
  if (last4 && !/^\d{4}$/.test(last4)) {
    return NextResponse.json({ error: "Last 4 digits must be exactly 4 digits." }, { status: 400 });
  }
  if (first4 && !/^\d{4}$/.test(first4)) {
    return NextResponse.json({ error: "First 4 digits must be exactly 4 digits." }, { status: 400 });
  }
  const c = await db();
  const id = uid();
  await c.execute(
    `INSERT INTO cards (id, user_id, bank_id, bank_name, card_label, last4_enc, first4_enc, password_enc, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id,
      userId,
      bank.id,
      bank.name,
      cardLabel.trim().slice(0, 60),
      last4 ? encrypt(String(last4), userId) : null,
      first4 ? encrypt(String(first4), userId) : null,
      customPassword ? encrypt(String(customPassword), userId) : null,
      now(),
    ]
  );
  return NextResponse.json({ ok: true, id });
}
