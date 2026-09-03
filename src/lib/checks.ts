import { Check, ParsedStatement } from "./types";
import { FEE_RE, INTEREST_RE } from "./categories";

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

export interface PriorStatementInfo {
  periodEnd: string | null;
  periodStart: string | null;
}

export function runChecks(parsed: ParsedStatement, priors: PriorStatementInfo[]): Check[] {
  const { transactions: txns, summary } = parsed;
  const checks: Check[] = [];
  const debits = txns.filter((t) => t.type === "debit");
  const credits = txns.filter((t) => t.type === "credit");
  const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;
  const totalDebits = sum(debits.map((t) => t.amount));
  const totalCredits = sum(credits.map((t) => t.amount));

  checks.push(
    txns.length > 0
      ? {
          id: "extraction", label: "Transactions extracted", status: "pass",
          detail: `${txns.length} transactions (${debits.length} debits, ${credits.length} credits) via the ${parsed.parser} parser.`,
        }
      : { id: "extraction", label: "Transactions extracted", status: "fail", detail: "No transactions could be read from this PDF." }
  );

  for (const [id, label, computed, stated] of [
    ["debit-tally", "Debits tally with statement total", totalDebits, summary.statedDebits],
    ["credit-tally", "Credits tally with statement total", totalCredits, summary.statedCredits],
  ] as const) {
    if (stated === undefined) {
      checks.push({ id, label, status: "warn", detail: `Computed ${inr(computed)}. No printed total was found on the statement to verify against.` });
    } else if (Math.abs(computed - stated) < 1) {
      checks.push({ id, label, status: "pass", detail: `Computed ${inr(computed)} matches the printed total ${inr(stated)}.` });
    } else {
      checks.push({ id, label, status: "fail", detail: `Computed ${inr(computed)} vs printed ${inr(stated)}, a difference of ${inr(Math.abs(computed - stated))}. Rows may be missing or misread. Review before saving.` });
    }
  }

  const fees = txns.filter((t) => t.type === "debit" && FEE_RE.test(t.description));
  checks.push(
    fees.length
      ? { id: "fees", label: "Fee charges", status: "warn", detail: `${fees.length} fee(s) detected totalling ${inr(sum(fees.map((f) => f.amount)))}: ${fees.map((f) => `${f.description} (${inr(f.amount)})`).join("; ")}. Banks often reverse annual and joining fees on request or on crossing a spend milestone.` }
      : { id: "fees", label: "Fee charges", status: "pass", detail: "No annual, joining, renewal, late or over-limit fees found." }
  );

  const interest = txns.filter(
    (t) =>
      t.type === "debit" &&
      INTEREST_RE.test(t.description) &&
      !FEE_RE.test(t.description) &&
      !/\bemi\b|equated monthly|\binstal?lment\b/i.test(t.description)
  );
  checks.push(
    interest.length
      ? { id: "interest", label: "Interest / finance charges", status: "warn", detail: `${inr(sum(interest.map((t) => t.amount)))} charged as interest, which indicates the previous statement was not paid in full. Revolving credit card debt typically costs 36 to 48% APR.` }
      : { id: "interest", label: "Interest / finance charges", status: "pass", detail: "No revolving interest on this statement, so the previous bill was cleared in full by its due date." }
  );

  const gst = txns.filter((t) => t.type === "debit" && /\bgst|igst|cgst|sgst\b/i.test(t.description));
  if (gst.length)
    checks.push({ id: "gst", label: "GST on charges", status: "warn", detail: `${inr(sum(gst.map((t) => t.amount)))} of GST levied on fees or interest. If the underlying fee is reversed, request reversal of the GST as well.` });

  const seen = new Map<string, number>();
  for (const t of txns) {
    const k = `${t.date}|${t.description.toLowerCase()}|${t.amount}`;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  const dupes = [...seen.entries()].filter(([, n]) => n > 1);
  checks.push(
    dupes.length
      ? { id: "duplicates", label: "Duplicate charges", status: "warn", detail: `${dupes.length} identical date, merchant, and amount pair(s): ${dupes.map(([k]) => k.split("|")[1]).slice(0, 3).join(", ")}. A repeated charge may be a double swipe and can be disputed.` }
      : { id: "duplicates", label: "Duplicate charges", status: "pass", detail: "No identical duplicate transactions." }
  );

  const cash = txns.filter((t) => /cash advance|atm wdl|atm withdrawal/i.test(t.description));
  if (cash.length)
    checks.push({ id: "cash", label: "Cash advances", status: "warn", detail: `${cash.length} cash advance(s). Cash advances accrue interest from the transaction date and carry a fee.` });

  const intl = txns.filter((t) => t.isInternational);
  if (intl.length)
    checks.push({ id: "intl", label: "International spend", status: "warn", detail: `${intl.length} foreign-currency transaction(s) totalling ${inr(sum(intl.map((t) => t.amount)))}. Check the forex markup (typically about 3.5%) and the GST applied on it.` });

  if (summary.dueDate) {
    const days = Math.ceil((new Date(summary.dueDate).getTime() - Date.now()) / 86_400_000);
    const paise = summary.totalDue !== undefined ? Math.round(summary.totalDue * 100) % 100 : 0;
    const paiseNote =
      paise > 0
        ? ` Ends in ${String(paise).padStart(2, "0")} paise: round up, never down, as some issuers treat a short payment as unpaid.`
        : "";

    checks.push({
      id: "due", label: "Payment due", status: days < 0 ? "warn" : "pass",
      detail: days < 0
        ? `Due date ${summary.dueDate} has passed. Total due was ${summary.totalDue !== undefined ? inr(summary.totalDue) : "unknown"}.${paiseNote}`
        : `${summary.totalDue !== undefined ? inr(summary.totalDue) : "Amount"} due by ${summary.dueDate} (${days} day${days === 1 ? "" : "s"} away). Pay the total due, not the minimum.${paiseNote}`,
    });
  }

  if (summary.periodStart && priors.length) {
    const prevEnd = priors
      .map((p) => p.periodEnd)
      .filter((d): d is string => !!d && d < summary.periodStart!)
      .sort()
      .pop();
    if (prevEnd) {
      const gap = Math.round((new Date(summary.periodStart).getTime() - new Date(prevEnd).getTime()) / 86_400_000);
      checks.push(
        gap > 5
          ? { id: "continuity", label: "Statement continuity", status: "warn", detail: `${gap}-day gap since the previous saved statement (ended ${prevEnd}). A statement in between may be missing.` }
          : { id: "continuity", label: "Statement continuity", status: "pass", detail: `Follows on from the previous statement (ended ${prevEnd}).` }
      );
    }
  }
  if (summary.periodEnd && priors.some((p) => p.periodEnd === summary.periodEnd)) {
    checks.push({ id: "already-saved", label: "Duplicate statement", status: "fail", detail: `A statement ending ${summary.periodEnd} is already saved for this card. Saving it again would double-count.` });
  }

  return checks;
}
