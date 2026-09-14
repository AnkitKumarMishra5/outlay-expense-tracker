import type { LayoutRow } from "./pdf";
import { ParsedStatement, ParsedTxn, StatementSummary } from "./types";
import { categorize, FEE_RE, INTL_RE, type CategoryRule } from "./categories";

const DATE_RE = /^(\d{2})[\/\-.](\d{2})[\/\-.](\d{2,4})\b/;

/**
 * The same date, but allowed a little run-up. Statements print columns, and a
 * neighbouring column can bleed onto the front of a row: one real ICICI line
 * arrived as "100%  24/07/2026  ...", and anchoring at the start silently
 * dropped the transaction. Only a short, digit-or-symbol prefix is tolerated,
 * so a date sitting inside a description still cannot start a row.
 */
const LEADING_NOISE_RE = /^(.{0,10}?)(\d{2})[\/\-.](\d{2})[\/\-.](\d{2,4})\b/;

/**
 * "19Jul 2026", "22 Jul 2026", "24 Aug 26", "24-Aug-26". HDFC runs the day into
 * the month name, SBI prints a two-digit year. A figure like "50.00" is never a year.
 */
const NAMED_DATE_RE = /^(\d{1,2})[\s-]?([A-Za-z]{3,9})\.?,?[\s\-']+(\d{4}|\d{2})\b(?![.,]\d)/;

/** "Aug 24, 2026", month first. */
const MONTH_FIRST_ROW_RE = /^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4}|\d{2})\b(?![.,]\d)/;

function rowStart(line: string): { rest: string; date: string | null } | null {
  const direct = line.match(DATE_RE);
  if (direct) return { rest: line.slice(direct[0].length).trim(), date: toISO(direct[1], direct[2], direct[3]) };

  const named = line.match(NAMED_DATE_RE);
  if (named) {
    const iso = fromTextDate(named[1], named[2], named[3]);
    if (iso) return { rest: line.slice(named[0].length).trim(), date: iso };
  }

  const monthFirst = line.match(MONTH_FIRST_ROW_RE);
  if (monthFirst) {
    const iso = fromTextDate(monthFirst[2], monthFirst[1], monthFirst[3]);
    if (iso) return { rest: line.slice(monthFirst[0].length).trim(), date: iso };
  }

  const loose = line.match(LEADING_NOISE_RE);
  if (!loose) return null;
  const prefix = loose[1];
  // A run-up may only be stray column bleed, never words.
  if (/[A-Za-z]{3,}/.test(prefix)) return null;
  return { rest: line.slice(loose[0].length).trim(), date: toISO(loose[2], loose[3], loose[4]) };
}
/** An amount and its marker: "Cr"/"Dr", or SBI's bare "C"/"D", never the start of a word. */
const MONEY_RE = /((?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2})\s*(Cr|CR|cr|Dr|DR|C|D)?(?![A-Za-z])\.?/g;

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
    .replace(/^,?\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?\s+/, "")
    .replace(/^,\s*\d{3,4}\b\s*/, "")
    .replace(/^\d{8,}\s+(?=\S)/, "")
    .replace(/^EMI\s+(?!principal|interest|instal|conversion|booking|due|amount)/i, "")
    .replace(/(?:\s+[A-Za-z]\b)+\s*$/, "")
    .replace(/\s*\+\s*\d[\d,]*\s*$/, "")
    .replace(/[+\-]?\s*[\u20b9$]\s*$/, "")
    .replace(/\s*[+\-]\s*\d[\d,]*\s*$/, "")
    // A points column sits two spaces clear; "BPCL Ufill 2" is one cell.
    .replace(/\s{2,}[+\-]?\d{1,4}\s*$/, "")
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
  /\b(?:payment received|payment credit|cc payment|card payment|payment thank|autopay|neft|imps|upi credit|refund|reversal|reversed|chargeback|cashback|cash back|credit adjustment)\b/i;

const SKIP_RE =
  /statement of account|page \d|opening balance|closing balance|total amount due|minimum amount due|payment due date|credit limit|available credit|reward point|gstin|important information/i;

export function heuristicParse(text: string, layout?: LayoutRow[], rules: CategoryRule[] = []): ParsedStatement {
  const transactions: ParsedTxn[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line || SKIP_RE.test(line)) continue;
    const head = rowStart(line);
    if (!head) continue;
    const rest = head.rest;
    const am = lastAmount(rest);
    if (!am) continue;
    const date = head.date;
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
    const credit = marker === "cr" || marker === "c";
    const debit = marker === "dr" || marker === "d";
    const type = credit || (!debit && CREDIT_RE.test(description)) ? "credit" : "debit";
    transactions.push({
      date,
      description,
      amount,
      type,
      category: categorize(description, rules, type),
      isFee: FEE_RE.test(description),
      isInternational: INTL_RE.test(description),
    });
  }
  return { parser: "heuristic", summary: extractSummary(text, layout), transactions };
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

/** "12 Sep 2026", and SBI's "13 Aug 26". Never the start of a figure like "26.00". */
const TEXT_DATE = String.raw`(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4}|\d{2})(?![\d.,])`;
/** What issuers call the day a statement was made: Axis prints "Statement Generation Date". */
const STATEMENT_DATE_LABEL = String.raw`statement (?:generation |issue )?date|date of statement|bill(?:ing)? date|statement generated on`;
/** A heading that names exactly the credits column, never "Credit Limit" or "Payment Due Date". */
const CREDITS_HEADING = /^(?:payments?|credits?)(?:\s*(?:&|and|\/)\s*(?:other\s+)?(?:credits?|payments?))?$/i;
const DEBITS_HEADING = /^(?:purchases?|debits?|spends?)(?:\s*(?:&|and|\/)\s*(?:other\s+)?(?:debits?|charges?))?$/i;
/** "August 30, 2026", which is how ICICI and a few others print it. */
const MONTH_FIRST = String.raw`([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})`;

/**
 * Statements lay out summaries as a grid, so a label and its value are often
 * on different lines: "PAYMENT DUE DATE" sits in a header row and the date
 * three rows below it. Anything that only looks along one line misses those.
 */
function nearLabel(text: string, labels: RegExp, lookahead = 6, skip?: RegExp): string | null {
  const lines = text.split("\n");
  const idx = lines.findIndex((l) => labels.test(l) && !skip?.test(l));
  if (idx === -1) return null;
  return lines.slice(idx, idx + lookahead + 1).join("\n");
}

function fromTextDate(dd: string, mon: string, yyyy: string): string | undefined {
  const mm = MONTHS[mon.slice(0, 3).toLowerCase()];
  const day = Number(dd);
  if (!mm || day < 1 || day > 31) return undefined;
  const year = yyyy.length === 2 ? `20${yyyy}` : yyyy;
  return `${year}-${mm}-${dd.padStart(2, "0")}`;
}

function findTextDate(text: string, labels: RegExp): string | undefined {
  const re = new RegExp(`(?:${labels.source})` + String.raw`[^0-9\n]{0,40}` + TEXT_DATE, "i");
  const m = text.match(re);
  return m ? fromTextDate(m[1], m[2], m[3]) : undefined;
}

function amountsOn(line: string): number[] {
  return (line.match(/(?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2}/g) ?? []).map(parseAmount);
}

/** The same figures, a "Cr" after one making it negative: a balance in the cardholder's favour. */
function signedAmountsOn(line: string): number[] {
  return [...line.matchAll(/((?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2})(?:\s*(Cr|Dr)\b)?/gi)].map((m) =>
    m[2]?.toLowerCase() === "cr" ? -parseAmount(m[1]) : parseAmount(m[1])
  );
}

/** Same idea from the text alone, for pages with no usable geometry. */
/** The figure printed under a heading, matched by the column both stand in. */
function alignedCell(
  layout: LayoutRow[],
  label: RegExp,
  wanted: (text: string) => boolean,
  lookahead = 8
): string | undefined {
  for (let i = 0; i < layout.length; i++) {
    const head = layout[i].cells.find((c) => label.test(c.text));
    if (!head) continue;
    for (let j = i + 1; j < layout.length && j <= i + lookahead; j++) {
      if (layout[j].page !== layout[i].page) break;
      let best: { text: string; overlap: number } | null = null;
      for (const cell of layout[j].cells) {
        if (!wanted(cell.text)) continue;
        const overlap = Math.min(head.x1, cell.x1) - Math.max(head.x0, cell.x0);
        if (overlap <= 0) continue;
        if (!best || overlap > best.overlap) best = { text: cell.text, overlap };
      }
      if (best) return best.text;
    }
  }
  return undefined;
}

const CELL_MONEY = /(?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2}/;

function alignedAmount(layout: LayoutRow[] | undefined, label: RegExp): number | undefined {
  if (!layout?.length) return undefined;
  const cell = alignedCell(layout, label, (t) => CELL_MONEY.test(t));
  const m = cell?.match(CELL_MONEY);
  return m ? parseAmount(m[0]) : undefined;
}

function alignedDate(layout: LayoutRow[] | undefined, label: RegExp): string | undefined {
  if (!layout?.length) return undefined;
  const dated = (t: string) =>
    new RegExp(TEXT_DATE).test(t) || new RegExp(MONTH_FIRST).test(t) || /\d{2}[/\-.]\d{2}[/\-.]\d{2,4}/.test(t);
  const cell = alignedCell(layout, label, dated);
  if (!cell) return undefined;
  const t = cell.match(new RegExp(TEXT_DATE));
  if (t) return fromTextDate(t[1], t[2], t[3]);
  const mf = cell.match(new RegExp(MONTH_FIRST));
  if (mf) return fromTextDate(mf[2], mf[1], mf[3]);
  const n = cell.match(/(\d{2})[/\-.](\d{2})[/\-.](\d{2,4})/);
  return n ? toISO(n[1], n[2], n[3]) ?? undefined : undefined;
}

function columnValue(text: string, label: RegExp): number | undefined {
  const lines = text.split("\n");
  // Headings are set in columns, so two or more spaces separate them.
  const cellsOf = (line: string) => line.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
  let headings: string[][] = [];
  let values: number[] = [];
  let valueLines = 0;

  const take = (): number | undefined => {
    for (let n = 1; n <= headings.length; n++) {
      const row = headings.slice(headings.length - n).flat();
      if (row.length !== values.length) continue;
      const at = row.findIndex((h) => label.test(h));
      return at === -1 ? undefined : values[at];
    }
    return undefined;
  };

  for (const raw of lines) {
    const line = raw.trim();
    const found = amountsOn(line);

    if (!line) {
      headings = [];
      values = [];
      valueLines = 0;
      continue;
    }
    // The row of = + + - between a grid's headings and its figures.
    if (!found.length && !/[A-Za-z0-9]/.test(line)) continue;

    if (found.length) {
      values.push(...found);
      valueLines++;
      if (headings.flat().length >= 3) {
        const hit = take();
        if (hit !== undefined) return hit;
      }
      // Figures can wrap onto a second or third line; past that it is a new
      // part of the page, not the same grid.
      if (valueLines >= 3 || values.length > headings.flat().length) {
        headings = [];
        values = [];
        valueLines = 0;
      }
      continue;
    }

    if (values.length) {
      headings = [];
      values = [];
      valueLines = 0;
    }
    const cells = cellsOf(line);
    if (cells.length && cells.every((c) => /[A-Za-z]/.test(c) && c.length <= 34)) headings.push(cells);
    else headings = [];
  }
  return undefined;
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

export function extractSummary(text: string, layout?: LayoutRow[]): StatementSummary {
  const summary: StatementSummary = {
    statementDate: findDate(text, new RegExp(STATEMENT_DATE_LABEL)),
    dueDate: findDate(text, /payment due date|due date/),
    totalDue: findAmount(text, /total (?:amount|payment) due|total dues/),
    minDue: findAmount(text, /minimum (?:amount|payment) due|min(?:imum)? due/),
    statedDebits: findAmount(text, /total (?:debits?|purchases?(?: & other (?:debits|charges))?|spends)/),
    // "Total Payment Due" starts the same way as "Total Payments", so a due is ruled out.
    statedCredits: findAmount(text, /total (?:credits?|payments?(?: (?:&|and) other credits)?)(?!\s*(?:amount\s+)?due)/),
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

  summary.statementDate ??= findTextDate(text, new RegExp(STATEMENT_DATE_LABEL));
  summary.dueDate ??= findTextDate(text, /payment due date|due date/);

  // Grid layouts: look a few lines past the label as well as along it.
  const nearStatement = nearLabel(text, new RegExp(STATEMENT_DATE_LABEL, "i"));
  const nearDue = nearLabel(text, /payment due date/i);
  // "…=Total Payment Due" in a balance sentence names the due but is followed
  // by every term's figure, the previous balance first. That sentence has its
  // own reader, so this one looks for the label anywhere else.
  const nearTotal = nearLabel(text, /total amount due|total payment due|total dues/i, 6, /=/);
  const nearMin = nearLabel(text, /minimum amount due|minimum payment due|min(?:imum)? due/i);

  const monthFirst = (block: string | null): string | undefined => {
    if (!block) return undefined;
    const m = block.match(new RegExp(MONTH_FIRST));
    return m ? fromTextDate(m[2], m[1], m[3]) : undefined;
  };
  const firstDate = (block: string | null): string | undefined => {
    if (!block) return undefined;
    const t = block.match(new RegExp(TEXT_DATE));
    if (t) return fromTextDate(t[1], t[2], t[3]);
    const n = block.match(/(\d{2})[\/\-.](\d{2})[\/\-.](\d{2,4})/);
    return n ? toISO(n[1], n[2], n[3]) ?? undefined : undefined;
  };
  const firstMoney = (block: string | null): number | undefined => {
    if (!block) return undefined;
    const m = block.match(/(?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2}/);
    return m ? parseAmount(m[0]) : undefined;
  };

  summary.statementDate ??= monthFirst(nearStatement) ?? firstDate(nearStatement);
  summary.dueDate ??= monthFirst(nearDue) ?? firstDate(nearDue);
  // Anchored on the label's own line, so this finds the value whether it sits
  // beside the label or under it. That beats the loose scan above, which can
  // wander off and pick up a credit limit, so it takes precedence.
  summary.totalDue = firstMoney(nearTotal) ?? summary.totalDue;
  summary.minDue = firstMoney(nearMin) ?? summary.minDue;

  summary.totalDue = columnValue(text, /total amount due|total payment due|total dues/i) ?? summary.totalDue;
  summary.minDue = columnValue(text, /minimum (?:amount |payment )?dues?$|^min(?:imum)? dues?$/i) ?? summary.minDue;
  summary.statedDebits ??= columnValue(text, DEBITS_HEADING);
  summary.statedCredits ??= columnValue(text, CREDITS_HEADING);

  summary.totalDue = alignedAmount(layout, /total amount due|total payment due|total dues?$/i) ?? summary.totalDue;
  const dueCell = layout?.length
    ? alignedCell(layout, /total amount due|total payment due|total dues?$/i, (t) => CELL_MONEY.test(t))
    : undefined;
  if (dueCell && /\bCr\b/i.test(dueCell) && summary.totalDue !== undefined) summary.totalDue = -Math.abs(summary.totalDue);
  summary.minDue = alignedAmount(layout, /^min(?:imum)? (?:amount |payment )?dues?$/i) ?? summary.minDue;
  summary.statedDebits = alignedAmount(layout, DEBITS_HEADING) ?? summary.statedDebits;
  summary.statedCredits = alignedAmount(layout, CREDITS_HEADING) ?? summary.statedCredits;
  summary.dueDate = alignedDate(layout, /^(?:payment )?due date$/i) ?? summary.dueDate;
  summary.statementDate = alignedDate(layout, new RegExp(`^(?:${STATEMENT_DATE_LABEL})$`, "i")) ?? summary.statementDate;

  // A period set in a grid, its two dates in the cell under the heading.
  const periodCell = layout?.length
    ? alignedCell(layout, /^(?:statement|billing) period$/i, (t) => PERIOD_NUMERIC.test(t) || new RegExp(`${TEXT_DATE}.*${TEXT_DATE}`).test(t))
    : undefined;
  if (periodCell) {
    const n = periodCell.match(PERIOD_NUMERIC);
    const t = periodCell.match(new RegExp(`${TEXT_DATE}\\s*(?:to|-|\u2013)\\s*${TEXT_DATE}`));
    summary.periodStart ??= n ? toISO(n[1], n[2], n[3]) ?? undefined : t ? fromTextDate(t[1], t[2], t[3]) : undefined;
    summary.periodEnd ??= n ? toISO(n[4], n[5], n[6]) ?? undefined : t ? fromTextDate(t[4], t[5], t[6]) : undefined;
  }

  const table = tableSummary(text);
  summary.totalDue ??= table.totalDue;
  summary.minDue ??= table.minDue;
  summary.dueDate ??= table.dueDate;
  summary.statedDebits ??= table.statedDebits;
  summary.statedCredits ??= table.statedCredits;

  // An account summary set as a grid, headings wrapped over several lines above
  // one row of figures. Only used when those figures reconcile.
  const grid = gridSummary(layout);
  if (grid) {
    summary.statedDebits = grid.statedDebits;
    summary.statedCredits = grid.statedCredits;
    summary.previousBalance = grid.previousBalance;
    summary.totalDue ??= grid.totalDue;
  }

  // The issuer's own arithmetic, when it prints it, outranks every guess above.
  const sum = equationSummary(text);
  if (sum.statedDebits !== undefined) summary.statedDebits = sum.statedDebits;
  if (sum.statedCredits !== undefined) summary.statedCredits = sum.statedCredits;
  if (sum.previousBalance !== undefined) summary.previousBalance = sum.previousBalance;
  summary.totalDue ??= sum.totalDue;

  // A credit limit is never a total. Any figure printed under a limit heading
  // is struck from the stated totals, whichever reader picked it up.
  const limits = limitFigures(text);
  for (const key of ["statedDebits", "statedCredits", "totalDue"] as const) {
    const v = summary[key];
    if (v !== undefined && v !== 0 && limits.has(Math.abs(v))) summary[key] = undefined;
  }

  return summary;
}

const PERIOD_NUMERIC = /(\d{2})[\/\-.](\d{2})[\/\-.](\d{2,4})\s*(?:to|-|\u2013)\s*(\d{2})[\/\-.](\d{2})[\/\-.](\d{2,4})/i;

/**
 * The balance sentence some issuers print, with its figures on the row under
 * it, e.g. Axis: "Previous Balance - Payments - Credits + Purchase + Cash
 * Advance + Other Debit&Charges =Total Payment Due" over seven amounts. Each
 * figure takes the sign of the term above it: minus terms are credits, plus
 * terms are debits, the one after = is the total due.
 */
function equationSummary(text: string): Partial<StatementSummary> {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes("=") || amountsOn(line).length) continue;
    const parts = line.split(/(\s+[-+]\s+|\s*=\s*)/);
    const terms: { sign: string; label: string }[] = [];
    for (let k = 0; k < parts.length; k += 2) {
      const label = parts[k].trim();
      if (label) terms.push({ sign: k === 0 ? "" : parts[k - 1].trim(), label });
    }
    if (terms.length < 4 || !terms.some((t) => t.sign === "=") || !terms.every((t) => /[a-z]/i.test(t.label))) continue;
    for (const next of lines.slice(i + 1, i + 4)) {
      // Balances carry a sign: "250.00 Cr" brought forward means the card was
      // in credit, which is minus 250, not plus. The movement terms already
      // take their sign from the sentence, so only their size matters.
      const values = signedAmountsOn(next);
      if (values.length !== terms.length) continue;
      const out: Partial<StatementSummary> = {};
      let credits = 0;
      let debits = 0;
      terms.forEach((t, n) => {
        if (t.sign === "=") out.totalDue = values[n];
        else if (t.sign === "-") credits += Math.abs(values[n]);
        else if (t.sign === "+") debits += Math.abs(values[n]);
        else if (/previous|opening|last statement/i.test(t.label)) out.previousBalance = values[n];
      });
      out.statedCredits = Math.round(credits * 100) / 100;
      out.statedDebits = Math.round(debits * 100) / 100;
      return out;
    }
  }
  return {};
}

type GridRole = "previous" | "credit" | "debit" | "total";

/** What an account summary column holds, read from its heading. Order matters: "Total Outstanding" is a total, not a debit. */
function gridRole(label: string): GridRole | null {
  const l = label.toLowerCase();
  if (/\blimit\b|reward|points?\b|milestone/.test(l)) return null;
  if (/total (?:outstanding|amount due|payment due|dues?)|closing balance|amount payable|new balance/.test(l)) return "total";
  if (/previous|opening|last statement|brought forward/.test(l)) return "previous";
  if (/payment|credit|reversal|refund|cashback/.test(l)) return "credit";
  if (/purchase|debit|spend|charge|fee|interest|tax|cash advance|addition|emi/.test(l)) return "debit";
  return null;
}

/**
 * An account summary laid out as a grid: headings wrapped over several lines
 * above a single row of figures, e.g. SBI's "Previous Balance", "Payments,
 * Reversals & other Credits", "Purchases & Other Debits", "Fee, Taxes &
 * Interest Charges", "Total Outstanding" over "0.18 CR 0.00 910.82 0.00 911.00".
 * Each heading piece is matched to the figure it sits above, every column has
 * to be recognised, and the result is only trusted if
 * previous balance - credits + debits comes to the total.
 */
function gridSummary(layout: LayoutRow[] | undefined): Partial<StatementSummary> | null {
  if (!layout?.length) return null;
  const money = /^((?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2})(?:\s*(Cr|Dr)\b)?$/i;
  for (let i = 0; i < layout.length; i++) {
    const figures = layout[i].cells.map((c) => ({ cell: c, m: c.text.trim().match(money) })).filter((f) => f.m);
    if (figures.length < 4 || figures.length !== layout[i].cells.length) continue;
    const centre = (c: { x0: number; x1: number }) => (c.x0 + c.x1) / 2;
    const labels = figures.map(() => [] as string[]);
    for (let j = i - 1; j >= 0 && j >= i - 7; j--) {
      if (layout[j].page !== layout[i].page) break;
      if (layout[j].cells.some((c) => CELL_MONEY.test(c.text))) break;
      for (const cell of layout[j].cells) {
        if (!/[A-Za-z]{3,}/.test(cell.text)) continue;
        let nearest = -1;
        let gap = Infinity;
        figures.forEach((f, k) => {
          const d = Math.abs(centre(f.cell) - centre(cell));
          if (d < gap) { gap = d; nearest = k; }
        });
        if (nearest !== -1 && gap < 60) labels[nearest].unshift(cell.text);
      }
    }
    const roles = labels.map((parts) => gridRole(parts.join(" ")));
    if (roles.some((r) => r === null) || roles.filter((r) => r === "total").length !== 1) continue;
    const values = figures.map((f) => {
      const v = parseAmount(f.m![1]);
      return f.m![2]?.toLowerCase() === "cr" ? -v : v;
    });
    let previous = 0;
    let credits = 0;
    let debits = 0;
    let total = 0;
    roles.forEach((role, k) => {
      if (role === "previous") previous = values[k];
      else if (role === "credit") credits += Math.abs(values[k]);
      else if (role === "debit") debits += Math.abs(values[k]);
      else total = values[k];
    });
    // Banks round the total to the rupee, so allow a little slack.
    if (Math.abs(previous - credits + debits - total) > Math.max(1, Math.abs(total) * 0.005)) continue;
    const round = (n: number) => Math.round(n * 100) / 100;
    return {
      previousBalance: roles.includes("previous") ? round(previous) : undefined,
      statedCredits: round(credits),
      statedDebits: round(debits),
      totalDue: round(total),
    };
  }
  return null;
}

/** Figures printed under a heading that names a limit: credit, available or cash. */
function limitFigures(text: string): Set<number> {
  const lines = text.split("\n");
  const out = new Set<number>();
  lines.forEach((line, i) => {
    if (!/\blimit\b/i.test(line) || amountsOn(line).length) return;
    const next = lines.slice(i + 1, i + 5).find((l) => amountsOn(l).length);
    for (const v of next ? amountsOn(next) : []) out.add(v);
  });
  return out;
}

export function redact(text: string): string {
  return text
    .replace(/\b(?:\d[ -]?){12,15}(\d{4})\b/g, "XXXX-XXXX-XXXX-$1")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email]")
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "[PAN]")
    .replace(/\b\d{4}\s\d{4}\s\d{4}\b/g, "[ID]")
    .replace(/(\+91[ -]?)?\b[6-9]\d{9}\b/g, "[phone]");
}
