export type TxnType = "debit" | "credit";

export interface ParsedTxn {
  date: string; // ISO yyyy-mm-dd
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
  totals: { debits: number; credits: number; fees: number; txns: number };
  byMonth: { month: string; debits: number }[];
  byCategory: { category: string; total: number }[];
  byCard: { card_id: string; card_label: string; bank_id: string; last4: string | null; debits: number; txns: number; next_due: string | null; next_due_amount: number | null }[];
  recent: { id: string; txn_date: string; description: string; amount: number; type: string; category: string; is_fee: number }[];
  byDay: { day: string; debits: number; txns: number }[];
  dayCards: { day: string; card_id: string; card_label: string; bank_id: string; last4: string | null; debits: number; txns: number }[];
  subscriptions: import("./subscriptions").Subscription[];
  dues: { id: string; card_id: string; day: string; statement_date: string | null; amount: number | null; min_due: number | null; settled: boolean; paid_at: string | null; card_label: string; bank_id: string; last4: string | null }[];
}
