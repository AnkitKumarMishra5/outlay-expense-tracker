import { ParsedStatement, ParsedTxn, StatementSummary } from "./types";
import { categorize, FEE_RE, INTL_RE } from "./categories";

const DATE_RE = /^(\d{2})[\/\-.](\d{2})[\/\-.](\d{2,4})\b/;
const MONEY_RE = /((?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2})\s*(Cr|CR|cr|Dr|DR)?\.?/g;

function lastAmount(rest: string) {
  MONEY_RE.lastIndex = 0;
  let chosen: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = MONEY_RE.exec(rest))) {
    const tail = rest.slice(m.index + m[0].length);
    if (/\d/.test(tail) || tail.trim().length > 8) continue;
    chosen = m;
  }
  return chosen;
}

function cleanDescription(raw: string): string {
  return raw
    .replace(/^[|\-–—:\s]+/, "")
    .replace(/^\d{1,2}:\d{2}(?::\d{2})?\s+/, "")
    .replace(/^EMI\s+(?!principal|interest|instal|conversion|booking|due|amount)/i, "")
    .replace(/(?:\s+[A-Za-z]\b)+\s*$/, "")
    .replace(/\s*\+\s*\d[\d,]*\s*$/, "")
    .replace(/(?:\s+[A-Za-z]\b)+\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toISO(dd: string, mm: string, yy: string): string | null {
  const year = yy.length === 2 ? `20${yy}` : yy;
  const d = Number(dd), m = Number(mm);
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;
  return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

export function parseAmount(s: string): number {
  return Number(s.replace(/,/g, ""));
}

const CREDIT_RE =
  /\b(?:payment received|cc payment|card payment|payment thank|neft|imps|upi credit|refund|reversal|reversed|cashback|credit adjustment)\b/i;

const SKIP_RE =
  /statement of account|page \d|opening balance|closing balance|total amount due|minimum amount due|payment due date|credit limit|available credit|reward point|gstin|important information/i;

export function heuristicParse(text: string): ParsedStatement {
  const transactions: ParsedTxn[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line || SKIP_RE.test(line)) continue;
    const dm = line.match(DATE_RE);
    if (!dm) continue;
    const rest = line.slice(dm[0].length).trim();
    const am = lastAmount(rest);
    if (!am) continue;
    const date = toISO(dm[1], dm[2], dm[3]);
    if (!date) continue;
    let description = cleanDescription(rest.slice(0, am.index));
    if (description.length < 3) {
      const above = (lines[i - 1] ?? "").trim();
      if (above && !DATE_RE.test(above) && !/\d[\d,]*\.\d{2}/.test(above) && !SKIP_RE.test(above)) {
        description = cleanDescription(above.replace(/\s*\(ref#?\s*$/i, ""));
      }
    }
    if (!description) description = "Unlabelled transaction";
    const amount = parseAmount(am[1]);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const marker = am[2]?.toLowerCase();
    const type = marker === "cr" || (marker !== "dr" && CREDIT_RE.test(description)) ? "credit" : "debit";
    transactions.push({
      date,
      description,
      amount,
      type,
      category: categorize(description),
      isFee: FEE_RE.test(description),
      isInternational: INTL_RE.test(description),
    });
  }
  return { parser: "heuristic", summary: extractSummary(text), transactions };
}

function findAmount(text: string, labels: RegExp): number | undefined {
  const re = new RegExp(`(?:${labels.source})` + String.raw`[^0-9\n]{0,40}((?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2})`, "i");
  const m = text.match(re);
  return m ? parseAmount(m[1]) : undefined;
}

function findDate(text: string, labels: RegExp): string | undefined {
  const re = new RegExp(`(?:${labels.source})` + String.raw`[^0-9\n]{0,40}(\d{2})[\/\-.](\d{2})[\/\-.](\d{2,4})`, "i");
  const m = text.match(re);
  return m ? toISO(m[1], m[2], m[3]) ?? undefined : undefined;
}

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

const TEXT_DATE = String.raw`(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})`;

function fromTextDate(dd: string, mon: string, yyyy: string): string | undefined {
  const mm = MONTHS[mon.slice(0, 3).toLowerCase()];
  if (!mm) return undefined;
  return `${yyyy}-${mm}-${dd.padStart(2, "0")}`;
}

function findTextDate(text: string, labels: RegExp): string | undefined {
  const re = new RegExp(`(?:${labels.source})` + String.raw`[^0-9\n]{0,40}` + TEXT_DATE, "i");
  const m = text.match(re);
  return m ? fromTextDate(m[1], m[2], m[3]) : undefined;
}

function amountsOn(line: string): number[] {
  return (line.match(/(?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2}/g) ?? []).map(parseAmount);
}

function tableSummary(text: string): Partial<StatementSummary> {
  const lines = text.split("\n");
  const out: Partial<StatementSummary> = {};

  const totalsRow = lines.find((l) => /=/.test(l) && amountsOn(l).length >= 4);
  if (totalsRow) {
    const values = amountsOn(totalsRow);
    out.totalDue = values[values.length - 1];
    if (values.length === 5) {
      out.statedCredits = values[1];
      out.statedDebits = values[2];
    }
  }

  const minIdx = lines.findIndex((l) => /minimum\s+(?:amount\s+)?due/i.test(l));
  if (minIdx !== -1) {
    for (const l of lines.slice(minIdx + 1, minIdx + 4)) {
      const values = amountsOn(l);
      if (values.length) {
        out.minDue = values[0];
        const d = l.match(new RegExp(TEXT_DATE));
        if (d) out.dueDate = fromTextDate(d[1], d[2], d[3]);
        break;
      }
    }
  }
  return out;
}

export function extractSummary(text: string): StatementSummary {
  const summary: StatementSummary = {
    statementDate: findDate(text, /statement date/),
    dueDate: findDate(text, /payment due date|due date/),
    totalDue: findAmount(text, /total (?:amount|payment) due|total dues/),
    minDue: findAmount(text, /minimum (?:amount|payment) due|min(?:imum)? due/),
    statedDebits: findAmount(text, /total (?:debits?|purchases?(?: & other (?:debits|charges))?|spends)/),
    statedCredits: findAmount(text, /total (?:credits?|payments?(?: & other credits)?)/),
  };
  const period = text.match(
    /(?:statement period|period)[^0-9\n]{0,20}(\d{2})[\/\-.](\d{2})[\/\-.](\d{2,4})\s*(?:to|-|\u2013)\s*(\d{2})[\/\-.](\d{2})[\/\-.](\d{2,4})/i
  );
  if (period) {
    summary.periodStart = toISO(period[1], period[2], period[3]) ?? undefined;
    summary.periodEnd = toISO(period[4], period[5], period[6]) ?? undefined;
  }

  const textPeriod = text.match(
    new RegExp(String.raw`(?:billing period|statement period|period)[^0-9\n]{0,20}` + TEXT_DATE + String.raw`\s*(?:to|-|\u2013)\s*` + TEXT_DATE, "i")
  );
  if (textPeriod) {
    summary.periodStart ??= fromTextDate(textPeriod[1], textPeriod[2], textPeriod[3]);
    summary.periodEnd ??= fromTextDate(textPeriod[4], textPeriod[5], textPeriod[6]);
  }

  summary.statementDate ??= findTextDate(text, /statement date/);
  summary.dueDate ??= findTextDate(text, /payment due date|due date/);

  const table = tableSummary(text);
  summary.totalDue ??= table.totalDue;
  summary.minDue ??= table.minDue;
  summary.dueDate ??= table.dueDate;
  summary.statedDebits ??= table.statedDebits;
  summary.statedCredits ??= table.statedCredits;

  return summary;
}

export function redact(text: string): string {
  return text
    .replace(/\b(?:\d[ -]?){12,15}(\d{4})\b/g, "XXXX-XXXX-XXXX-$1")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email]")
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "[PAN]")
    .replace(/\b\d{4}\s\d{4}\s\d{4}\b/g, "[ID]")
    .replace(/(\+91[ -]?)?\b[6-9]\d{9}\b/g, "[phone]");
}
