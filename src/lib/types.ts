export type TxnType = "debit" | "credit";

export interface ParsedTxn {
  date: string; // ISO yyyy-mm-dd
  /** HH:MM, when the statement prints the time of the charge. */
  time?: string;
  description: string;
  amount: number; // always positive
  type: TxnType;
  category?: string;
  isFee?: boolean;
  isInternational?: boolean;
}

export interface StatementSummary {
  periodStart?: string;
  periodEnd?: string;
  statementDate?: string;
  dueDate?: string;
  totalDue?: number;
  minDue?: number;
  statedDebits?: number;
  statedCredits?: number;
  /** The balance brought forward, when the statement prints its own arithmetic. */
  previousBalance?: number;
}

export type CheckStatus = "pass" | "warn" | "fail";

export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface ParsedStatement {
  parser: "heuristic";
  summary: StatementSummary;
  transactions: ParsedTxn[];
}

export interface CardRow {
  id: string;
  bank_id: string;
  bank_name: string;
  card_label: string;
  last4: string | null;
  first4: string | null;
  has_password: number;
  created_at: string;
  /** AI category reviews already used on this card this month. */
  ai_used?: number;
}

export interface StatementRow {
  id: string;
  card_id: string;
  period_start: string | null;
  period_end: string | null;
  statement_date: string | null;
  due_date: string | null;
  total_due: number | null;
  min_due: number | null;
  total_debits: number;
  total_credits: number;
  txn_count: number;
  paid_at: string | null;
  checks_json: string;
  filename: string;
  parser: string;
  created_at: string;
}

export interface Analytics {
  totals: { debits: number; credits: number; payments?: number; fees: number; txns: number; spend_txns?: number; credit_txns?: number };
  byCategory: { category: string; total: number }[];
  /** The same categories a month earlier, for the movement panel. */
  byCategoryPrev?: { category: string; total: number }[];
  byCard: { card_id: string; card_label: string; bank_id: string; last4: string | null; debits: number; txns: number; next_due: string | null; next_due_amount: number | null }[];
  /** This period's charges, largest first. */
  biggest: { id: string; txn_date: string; description: string; amount: number; category: string; is_fee: number; is_international: number; card_label: string; bank_id: string; last4: string | null }[];
  /** Every fee and charge in the period, so the tile can list them. */
  fees?: { txn_date: string; description: string; amount: number; card_label: string }[];
  /** Every month the account holds data for, newest first. */
  months?: string[];
  dues: { id: string; card_id: string; day: string; statement_date: string | null; amount: number | null; min_due: number | null; total_debits: number | null; txn_count: number | null; settled: boolean; paid_at: string | null; card_label: string; bank_id: string; last4: string | null }[];
}

/** The cross-month half of the dashboard, fetched separately so the rest of
 *  the page does not wait on it. */
export interface Timeline {
  byMonth: { month: string; debits: number }[];
  /** The same spend grouped by the statement that billed it. */
  byStatementMonth: { month: string; debits: number }[];
  /** Spend split by category, month by month, on each of those two bases. */
  byCategoryMonth: { month: string; category: string; debits: number }[];
  byCategoryStatementMonth: { month: string; category: string; debits: number }[];
  byDay: { day: string; debits: number; txns: number }[];
  dayCards: { day: string; card_id: string; card_label: string; bank_id: string; last4: string | null; debits: number; txns: number }[];
  subscriptions: import("./subscriptions").Subscription[];
}

