import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt, decryptOrNull, encrypt } from "@/lib/crypto";
import { candidatePasswords, inferPattern } from "@/lib/passwords";
import { hasNumbers, unlockAndExtract } from "@/lib/pdf";
import { heuristicParse } from "@/lib/parser";
import { runChecks, PriorStatementInfo } from "@/lib/checks";
import { currentUserId, unauthorized } from "@/lib/auth";
import { detectCard } from "@/lib/detect";
import { loadRules } from "@/lib/categoryRules";

export const maxDuration = 60;
const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorized();
  const form = await req.formData();
  const file = form.get("file");
  const cardId = form.get("cardId");
  const manualPassword = form.get("password");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than 15 MB." }, { status: 400 });
  }

  const c = await db();
  const allCardsRs = await c.execute("SELECT id, bank_id, last4_enc, first4_enc, password_enc FROM cards WHERE user_id = $1", [userId]);
  const allCards = (
    allCardsRs.rows as unknown as {
      id: string;
      bank_id: string;
      last4_enc: string | null;
      first4_enc: string | null;
      password_enc: string | null;
    }[]
  ).map((r) => ({
    id: r.id,
    bank_id: r.bank_id,
    password_enc: r.password_enc,
    last4: decryptOrNull(r.last4_enc, userId),
    first4: decryptOrNull(r.first4_enc, userId),
  }));
  const chosen = typeof cardId === "string" && cardId ? allCards.find((r) => r.id === cardId) ?? null : null;
  if (typeof cardId === "string" && cardId && !chosen) {
    return NextResponse.json({ error: "Unknown card." }, { status: 404 });
  }

  const candidates: string[] = [];
  if (typeof manualPassword === "string" && manualPassword) candidates.push(manualPassword);
  const pushStored = (enc: string | null) => {
    if (!enc) return;
    try {
      const pw = decrypt(enc, userId);
      if (!candidates.includes(pw)) candidates.push(pw);
    } catch {}
  };
  if (chosen) pushStored(chosen.password_enc);
  for (const row of allCards) if (row.id !== chosen?.id) pushStored(row.password_enc);

  const profRs = await c.execute("SELECT name_enc, dob_enc, custom_patterns FROM profile WHERE user_id = $1", [userId]);
  let profile: { name: string; dob: string; patterns: string[] } | null = null;
  if (profRs.rows.length) {
    const name = decrypt(profRs.rows[0].name_enc as string, userId);
    const dob = decrypt(profRs.rows[0].dob_enc as string, userId);
    let custom: string[] = [];
    try {
      const raw = JSON.parse((profRs.rows[0].custom_patterns as string) ?? "[]");
      if (Array.isArray(raw)) custom = raw.filter((t) => typeof t === "string");
    } catch {}
    profile = { name, dob, patterns: custom };
    const bankOrder = chosen ? [chosen.bank_id] : [...new Set(allCards.map((r) => r.bank_id))];
    const lastFours = chosen ? [chosen.last4] : [...new Set(allCards.map((r) => r.last4))];
    const firstFours = chosen ? [chosen.first4] : [...new Set(allCards.map((r) => r.first4))];
    for (const bank of bankOrder.length ? bankOrder : ["other"]) {
      for (const l4 of lastFours.length ? lastFours : [null]) {
        for (const f4 of firstFours.length ? firstFours : [null]) {
          for (const pw of candidatePasswords(bank, name, dob, l4, custom, f4)) {
            if (!candidates.includes(pw)) candidates.push(pw);
          }
        }
      }
    }
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const extracted = await unlockAndExtract(buffer, candidates);
  if (extracted.needsPassword) {
    return NextResponse.json(
      { needsPassword: true, tried: extracted.triedCount, error: `Tried ${extracted.triedCount} password pattern(s), none opened this PDF. Enter the statement password once and it will be remembered for this card.` },
      { status: 422 }
    );
  }

  const detection = detectCard(extracted.text);
  const sameBank = detection.bankId ? allCards.filter((r) => r.bank_id === detection.bankId) : [];
  const exact = detection.last4 ? sameBank.find((r) => r.last4 === detection.last4) ?? null : null;
  const soleUnnumbered =
    !detection.last4 && sameBank.length === 1 ? sameBank[0] : null;
  const conflicting = Boolean(detection.last4) && sameBank.length > 0 && !exact;
  const matched = chosen ?? exact ?? soleUnnumbered;

  if (extracted.password && matched) {
    let known: string | null = null;
    if (matched.password_enc) { try { known = decrypt(matched.password_enc, userId); } catch {} }
    if (known !== extracted.password) {
      await c.execute("UPDATE cards SET password_enc = $1 WHERE id = $2", [encrypt(extracted.password, userId), matched.id]);
    }
  }

  if (typeof manualPassword === "string" && manualPassword && extracted.password === manualPassword && profile) {
    const learned = inferPattern(
      manualPassword,
      profile.name,
      profile.dob,
      matched?.last4 ?? null,
      matched?.first4 ?? null
    );
    if (learned && !profile.patterns.includes(learned)) {
      const next = [...profile.patterns, learned].slice(0, 10);
      await c
        .execute("UPDATE profile SET custom_patterns = $1 WHERE user_id = $2", [JSON.stringify(next), userId])
        .catch(() => {});
    }
  }

  const parsed = heuristicParse(extracted.text, extracted.layout, await loadRules(c.execute, userId));

  // A statement whose font maps digits to nothing extracts as words with every
  // number missing. Calling that "not a statement" sends people hunting for the
  // wrong problem, so say what is actually wrong.
  if (parsed.transactions.length === 0 && !hasNumbers(extracted.text)) {
    return NextResponse.json(
      {
        notAStatement: true,
        filename: file.name,
        error:
          "This PDF's numbers are not stored as text, so nothing can be read from it. The words come through but every amount and date is missing. Ask your bank for the plain statement rather than the print-styled one, or send a version that is not a scan.",
      },
      { status: 422 }
    );
  }

  if (!detection.looksLikeStatement && parsed.transactions.length === 0) {
    return NextResponse.json(
      {
        notAStatement: true,
        filename: file.name,
        error: "This file does not look like a credit card statement.",
      },
      { status: 422 }
    );
  }

  const priorsRs = await c.execute(
    "SELECT period_start, period_end, statement_date, due_date, total_due FROM statements WHERE card_id = $1 AND user_id = $2",
    [matched?.id ?? "", userId]
  );
  const priors: PriorStatementInfo[] = priorsRs.rows.map((r) => ({
    periodStart: r.period_start as string | null,
    periodEnd: r.period_end as string | null,
    statementDate: r.statement_date as string | null,
    dueDate: r.due_date as string | null,
    totalDue: r.total_due != null ? Number(r.total_due) : null,
  }));
  const checks = runChecks(parsed, priors);

  return NextResponse.json({
    filename: file.name,
    unlocked: extracted.password !== null,
    passwordRemembered: extracted.password !== null,
    detection,
    matchedCardId: matched?.id ?? null,
    matchNote: conflicting
      ? `A ${detection.bankName} card is saved, but none ending ${detection.last4}.`
      : null,
    parser: parsed.parser,
    summary: parsed.summary,
    transactions: parsed.transactions,
    checks,
  });
}
