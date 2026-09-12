import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { CATEGORIES, FEE_RE, INTL_RE } from "@/lib/categories";
import { revalidate } from "@/lib/revalidate";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const sets: string[] = [];
  const args: unknown[] = [];

  const c = await db();
  const current = await c.execute("SELECT type, category FROM transactions WHERE id = $1 AND user_id = $2", [id, userId]);
  if (!current.rows.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const nextType = body.type === "debit" || body.type === "credit" ? body.type : (current.rows[0].type as string);

  // Credits is decided by the type, not chosen: anything the card gave back is
  // a credit, and a charge can never be one.
  let category: string | null = null;
  if (typeof body.category === "string") {
    if (!CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])) {
      return NextResponse.json({ error: "Unknown category." }, { status: 400 });
    }
    if (nextType === "credit" && body.category !== "Credits") {
      return NextResponse.json({ error: "A credit is always filed under Credits." }, { status: 400 });
    }
    if (nextType === "debit" && body.category === "Credits") {
      return NextResponse.json({ error: "Credits is only for money the card gave back." }, { status: 400 });
    }
    category = body.category;
  } else if (nextType === "credit" && current.rows[0].category !== "Credits") {
    category = "Credits";
  } else if (nextType === "debit" && current.rows[0].category === "Credits") {
    category = "Other";
  }
  if (category) {
    args.push(category);
    sets.push(`category = $${args.length}`);
  }
  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
    }
    args.push(Math.round(amount * 100) / 100);
    sets.push(`amount = $${args.length}`);
  }
  if (typeof body.description === "string" && body.description.trim()) {
    const description = body.description.trim().slice(0, 200);
    args.push(description);
    sets.push(`description = $${args.length}`);
    args.push(FEE_RE.test(description) ? 1 : 0);
    sets.push(`is_fee = $${args.length}`);
    args.push(INTL_RE.test(description) ? 1 : 0);
    sets.push(`is_international = $${args.length}`);
  }
  if (body.type === "debit" || body.type === "credit") {
    args.push(body.type);
    sets.push(`type = $${args.length}`);
  }
  if (typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    args.push(body.date);
    sets.push(`txn_date = $${args.length}`);
  }
  if (sets.length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  return c.tx(async (q) => {
    args.push(id, userId);
    const res = await q(
      `UPDATE transactions SET ${sets.join(", ")}
       WHERE id = $${args.length - 1} AND user_id = $${args.length}
       RETURNING statement_id`,
      args
    );
    if (!res.rows.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await revalidate(q, userId, res.rows[0].statement_id as string);
    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const c = await db();
  return c.tx(async (q) => {
    const res = await q(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING statement_id",
      [id, userId]
    );
    if (!res.rows.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await revalidate(q, userId, res.rows[0].statement_id as string);
    return NextResponse.json({ ok: true });
  });
}
