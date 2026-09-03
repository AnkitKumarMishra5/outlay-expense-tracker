import { NextRequest, NextResponse } from "next/server";
import { db, now, uid } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { describePattern, renderPattern } from "@/lib/passwords";
import { currentUserId, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const c = await db();
  const rs = await c.execute("SELECT name_enc, dob_enc, custom_patterns FROM profile WHERE user_id = $1", [userId]);
  if (rs.rows.length === 0) return NextResponse.json({ hasProfile: false });
  const dob = decrypt(rs.rows[0].dob_enc as string, userId);
  const name = decrypt(rs.rows[0].name_enc as string, userId);
  let templates: string[] = [];
  try {
    const raw = JSON.parse((rs.rows[0].custom_patterns as string) ?? "[]");
    if (Array.isArray(raw)) templates = raw.filter((t) => typeof t === "string");
  } catch {}
  return NextResponse.json({
    hasProfile: true,
    name,
    dobMasked: `••-••-${dob.slice(0, 4)}`,
    patterns: templates.map((template) => ({
      template,
      describe: describePattern(template),
      preview: renderPattern(template, name, dob, "4321", "4532"),
    })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const { name, dob, patterns } = await req.json();

  let templates: string[] | null = null;
  if (patterns !== undefined) {
    if (!Array.isArray(patterns) || patterns.some((t) => typeof t !== "string" || t.length > 80)) {
      return NextResponse.json({ error: "Patterns must be short text templates." }, { status: 400 });
    }
    templates = [...new Set(patterns.map((t: string) => t.trim()).filter(Boolean))];
    if (templates.length > 10) {
      return NextResponse.json(
        { error: "You can keep up to 10 patterns. Remove one before adding another." },
        { status: 400 }
      );
    }
  }

  const identityGiven = name !== undefined || dob !== undefined;

  if (!identityGiven) {
    if (!templates) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    const c = await db();
    const res = await c.execute("UPDATE profile SET custom_patterns = $1 WHERE user_id = $2", [
      JSON.stringify(templates),
      userId,
    ]);
    if (!res.rowsAffected) return NextResponse.json({ error: "Set up your profile first." }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (typeof name !== "string" || !name.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dob ?? "")) {
    return NextResponse.json({ error: "A name and a valid date of birth are required." }, { status: 400 });
  }
  const c = await db();
  const existing = await c.execute("SELECT id FROM profile WHERE user_id = $1", [userId]);
  if (existing.rows.length) {
    await c.execute(
      templates
        ? "UPDATE profile SET name_enc = $1, dob_enc = $2, custom_patterns = $4 WHERE user_id = $3"
        : "UPDATE profile SET name_enc = $1, dob_enc = $2 WHERE user_id = $3",
      templates
        ? [encrypt(name.trim(), userId), encrypt(dob, userId), userId, JSON.stringify(templates)]
        : [encrypt(name.trim(), userId), encrypt(dob, userId), userId]
    );
  } else {
    await c.execute(
      "INSERT INTO profile (id, user_id, name_enc, dob_enc, custom_patterns, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [uid(), userId, encrypt(name.trim(), userId), encrypt(dob, userId), JSON.stringify(templates ?? []), now()]
    );
  }
  return NextResponse.json({ ok: true });
}
