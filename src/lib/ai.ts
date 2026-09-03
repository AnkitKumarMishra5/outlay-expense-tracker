import { CATEGORIES } from "./categories";
import { redact } from "./parser";

const CATEGORY_SYSTEM = `You assign spending categories to Indian credit card statement rows.
Input is a JSON array of {"i": number, "d": "merchant description"}.
Return STRICT JSON {"categories":[{"i":number,"c":"category"}]} covering every input row.
c must be exactly one of: ${CATEGORIES.join(", ")}.
"EMI & Loans" is only for actual instalment or loan rows, never for a purchase that was
merely flagged as EMI eligible. Card fees, interest and taxes are "Fees & Charges".
Payments to the card and refunds are "Payments & Refunds".`;

export async function aiCategorize(rows: { id: string; description: string }[]): Promise<Map<string, string> | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || rows.length === 0) return null;
  const payload = rows.slice(0, 400).map((r, i) => ({ i, d: redact(r.description).slice(0, 120) }));
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: CATEGORY_SYSTEM },
          { role: "user", content: JSON.stringify(payload) },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    if (!Array.isArray(parsed.categories)) return null;
    const out = new Map<string, string>();
    for (const entry of parsed.categories) {
      const row = rows[entry?.i];
      if (!row) continue;
      if (CATEGORIES.includes(entry.c as (typeof CATEGORIES)[number])) out.set(row.id, entry.c);
    }
    return out.size ? out : null;
  } catch {
    return null;
  }
}
