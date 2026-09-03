import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const { confirm } = await req.json();
  if (confirm !== "DELETE EVERYTHING") {
    return NextResponse.json({ error: "Confirmation phrase mismatch." }, { status: 400 });
  }
  const c = await db();
  await c.tx(async (q) => {
    await q("DELETE FROM transactions WHERE user_id = $1", [userId]);
    await q("DELETE FROM statements WHERE user_id = $1", [userId]);
    await q("DELETE FROM cards WHERE user_id = $1", [userId]);
    await q("DELETE FROM profile WHERE user_id = $1", [userId]);
  });
  return NextResponse.json({ ok: true });
}
