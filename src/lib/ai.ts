import { SPEND_CATEGORIES, matchRule, type CategoryRule } from "./categories";
import { redact } from "./parser";

const CATEGORY_SYSTEM = `You assign spending categories to Indian credit card statement rows.
Every row is a charge. Payments, refunds and cashbacks never reach you.
Input is a JSON array of {"i": number, "d": "merchant description"}.
Return STRICT JSON {"categories":[{"i":number,"c":"category"}]} covering every input row.
c must be exactly one of: ${SPEND_CATEGORIES.join(", ")}.
Statements abbreviate merchants and run words together ("RAZ*SWIGGYBengaluru" is Swiggy,
"PARSEKARCHEMISTSDRUGGIST" is a chemist). Read through that. Use "Other" only when the
description gives no hint at all of what was bought.
"EMI & Loans" is only for actual instalment or loan rows, never for a purchase that was
merely flagged as EMI eligible. Card fees and interest are "Fees & Charges".
Tax paid through the card (income tax, advance tax, GST payments, challans) is "Taxes";
GST charged on a card fee stays "Fees & Charges".`;

/**
  * Rows per model call. Set by the model's output ceiling, not by taste: one
  * answer is about a dozen tokens per row, so 400 rows lands near 5k output
  * tokens with plenty of headroom under gpt-4o-mini's 16k cap. Larger batches
  * are split across calls and still cost one review.
  */
const CHUNK = 400;

export type AiOutcome =
  | { status: "ok"; categories: Map<string, string> }
  /** The request never reached the model. */
  | { status: "unreachable" }
  /** The model answered but the answer could not be read. */
  | { status: "unusable" };

async function callModel(
  key: string,
  payload: { i: number; d: string }[],
  system: string
): Promise<unknown[] | "unreachable" | "unusable"> {
  let res: Response;
  try {
    res = await fetch(`${("https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(payload) },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    return "unreachable";
  }
  if (!res.ok) return "unreachable";
  try {
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    return Array.isArray(parsed.categories) ? parsed.categories : "unusable";
  } catch {
    return "unusable";
  }
}

/**
 * A category per charge. The reader's rules are applied here in code first,
 * and those rows never reach the model, so a rule cannot be argued with. Only
 * the redacted merchant description leaves the server, never amounts, dates,
 * names or card digits.
 */
export async function aiCategorize(
  rows: { id: string; description: string; category?: string }[],
  rules: CategoryRule[] = []
): Promise<AiOutcome> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || rows.length === 0) return { status: "unreachable" };
  const out = new Map<string, string>();
  const spendRules = rules.filter((r) => (SPEND_CATEGORIES as readonly string[]).includes(r.category));

  const open: typeof rows = [];
  for (const row of rows) {
    const rule = matchRule(row.description, spendRules);
    if (rule) out.set(row.id, rule.category);
    else open.push(row);
  }

  for (let start = 0; start < open.length; start += CHUNK) {
    const slice = open.slice(start, start + CHUNK);
    const payload = slice.map((r, i) => ({ i, d: redact(r.description).slice(0, 120) }));
    const answer = await callModel(key, payload, CATEGORY_SYSTEM);
    if (answer === "unreachable") return start === 0 ? { status: "unreachable" } : { status: "unusable" };
    if (answer === "unusable") return { status: "unusable" };
    for (const entry of answer as { i?: number; c?: string }[]) {
      const row = slice[entry?.i ?? -1];
      if (!row || !(SPEND_CATEGORIES as readonly string[]).includes(entry?.c ?? "")) continue;
      // Other is where a guess goes to give up. It never replaces a category
      // that already says something.
      if (entry!.c === "Other" && row.category && row.category !== "Other") continue;
      out.set(row.id, entry!.c!);
    }
  }
  return out.size || open.length === 0 ? { status: "ok", categories: out } : { status: "unusable" };
}
