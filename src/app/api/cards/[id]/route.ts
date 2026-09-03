import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { currentUserId, unauthorized } from "@/lib/auth";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const sets: string[] = [];
  const args: unknown[] = [];

  for (const [key, column] of [
    ["last4", "last4_enc"],
    ["first4", "first4_enc"],
  ] as const) {
    if (body[key] === undefined) continue;
    const raw = body[key];
    if (raw === null || raw === "") {
      args.push(null);
      sets.push(`${column} = $${args.length}`);
      continue;
    }
    if (typeof raw !== "string" || !/^\d{4}$/.test(raw)) {
      return NextResponse.json({ error: "Card digits must be exactly 4 numbers." }, { status: 400 });
    }
    args.push(encrypt(raw, userId));
    sets.push(`${column} = $${args.length}`);
  }

  if (typeof body.cardLabel === "string" && body.cardLabel.trim()) {
    args.push(body.cardLabel.trim().slice(0, 60));
    sets.push(`card_label = $${args.length}`);
  }

  if (!sets.length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const c = await db();
  args.push(id, userId);
  const res = await c.execute(
    `UPDATE cards SET ${sets.join(", ")} WHERE id = $${args.length - 1} AND user_id = $${args.length}`,
    args
  );
  if (!res.rowsAffected) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const c = await db();
  const res = await c.execute("DELETE FROM cards WHERE id = $1 AND user_id = $2", [id, userId]);
  if (!res.rowsAffected) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
