import { NextRequest, NextResponse } from "next/server";
import { db, uid, now } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { SPEND_CATEGORIES } from "@/lib/categories";
import { loadRules } from "@/lib/categoryRules";

const MAX_RULES = 200;

export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const c = await db();
  return NextResponse.json({ rules: await loadRules(c.execute, userId), limit: MAX_RULES });
}

export async function POST(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const keyword = String(body?.keyword ?? "").trim();
  const category = String(body?.category ?? "");

  if (keyword.length < 2) return NextResponse.json({ error: "Give the keyword at least two characters." }, { status: 400 });
  if (keyword.length > 60) return NextResponse.json({ error: "Keep the keyword under 60 characters." }, { status: 400 });
  if (!(SPEND_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "That is not a category a charge can have." }, { status: 400 });
  }

  const c = await db();
  const count = await c.execute("SELECT COUNT(*)::int AS n FROM category_rules WHERE user_id = $1", [userId]);
  if (Number(count.rows[0].n) >= MAX_RULES) {
    return NextResponse.json({ error: `You can keep up to ${MAX_RULES} rules.` }, { status: 409 });
  }

  const rs = await c.execute(
    `INSERT INTO category_rules (id, user_id, keyword, category, created_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, lower(keyword)) DO UPDATE SET category = EXCLUDED.category
     RETURNING id, keyword, category`,
    [uid(), userId, keyword, category, now()]
  );
  return NextResponse.json({ ok: true, rule: rs.rows[0] });
}

export async function DELETE(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Which rule?" }, { status: 400 });
  const c = await db();
  const res = await c.execute("DELETE FROM category_rules WHERE id = $1 AND user_id = $2", [id, userId]);
  if (!res.rowsAffected) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
