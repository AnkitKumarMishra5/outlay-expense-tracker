import { NextRequest, NextResponse } from "next/server";
import { currentUserId, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { sweepState } from "@/lib/aiQuota";
import { applySweep, sweepAccount } from "@/lib/aiSweep";

export const maxDuration = 60;

/** How many sweeps are left this month. */
export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const c = await db();
  return NextResponse.json({ ai: await sweepState(c.execute, userId) });
}

/** Run a sweep, or apply the changes a previous one proposed. */
export async function POST(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => ({}));

  if (Array.isArray(body?.changes)) {
    const { applied } = await applySweep(userId, body.changes);
    return NextResponse.json({ ok: true, applied });
  }

  const result = await sweepAccount(userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, ai: result.ai }, { status: result.status ?? 500 });
  }
  return NextResponse.json({ ok: true, reviewed: result.reviewed, proposals: result.proposals, ai: result.ai });
}
