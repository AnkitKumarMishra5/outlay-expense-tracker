import { NextRequest, NextResponse } from "next/server";
import { db, now, uid } from "@/lib/db";
import { encrypt, decryptOrNull } from "@/lib/crypto";
import { bankById } from "@/lib/banks";
import { currentUserId, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const c = await db();
  const rs = await c.execute(`SELECT id, bank_id, bank_name, card_label, last4_enc, first4_enc,
            CASE WHEN password_enc IS NULL THEN 0 ELSE 1 END AS has_password, created_at
          FROM cards WHERE user_id = $1 ORDER BY created_at`, [userId]);
  return NextResponse.json({
    cards: rs.rows.map((r) => ({
      ...r,
      last4: decryptOrNull(r.last4_enc as string | null, userId),
      first4: decryptOrNull(r.first4_enc as string | null, userId),
      last4_enc: undefined,
      first4_enc: undefined,
    })),
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
