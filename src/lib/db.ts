import { Pool, type PoolClient } from "pg";

export interface Row {
  [key: string]: unknown;
}
export interface Result {
  rows: Row[];
  rowsAffected: number;
}
export type Query = (text: string, values?: unknown[]) => Promise<Result>;

let pool: Pool | null = null;
let ready: Promise<void> | null = null;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS profile (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name_enc TEXT NOT NULL,
    dob_enc TEXT NOT NULL,
    custom_patterns TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_id TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    card_label TEXT NOT NULL,
    last4_enc TEXT,
    first4_enc TEXT,
    password_enc TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS statements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    period_start TEXT,
    period_end TEXT,
    statement_date TEXT,
    due_date TEXT,
    total_due DOUBLE PRECISION,
    min_due DOUBLE PRECISION,
    total_debits DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_credits DOUBLE PRECISION NOT NULL DEFAULT 0,
    stated_debits DOUBLE PRECISION,
    stated_credits DOUBLE PRECISION,
    previous_balance DOUBLE PRECISION,
    statement_month TEXT,
    txn_count INTEGER NOT NULL DEFAULT 0,
    checks_json TEXT NOT NULL DEFAULT '[]',
    paid_at TEXT,
    filename TEXT NOT NULL DEFAULT '',
    parser TEXT NOT NULL DEFAULT 'heuristic',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    statement_id TEXT NOT NULL REFERENCES statements(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    txn_date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('debit','credit')),
    category TEXT NOT NULL DEFAULT 'Other',
    is_fee INTEGER NOT NULL DEFAULT 0,
    is_international INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS ai_usage (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    month TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, card_id, month)
  )`,
  `CREATE TABLE IF NOT EXISTS category_rules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_category_rule_unique
     ON category_rules(user_id, lower(keyword))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_stmt_period_unique
     ON statements(user_id, card_id, period_start, period_end)
     WHERE period_end IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_txn_user_date ON transactions(user_id, txn_date)`,
  `CREATE INDEX IF NOT EXISTS idx_txn_user_card ON transactions(user_id, card_id)`,
  `CREATE INDEX IF NOT EXISTS idx_stmt_user_card ON statements(user_id, card_id)`,
  `CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(user_id)`,
];

// CREATE TABLE IF NOT EXISTS is a no-op once a table exists, so every column added
// after a database was first created must also be stated here.
const MIGRATIONS = [
  `ALTER TABLE profile ADD COLUMN IF NOT EXISTS custom_patterns TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE cards ADD COLUMN IF NOT EXISTS last4_enc TEXT`,
  `ALTER TABLE cards ADD COLUMN IF NOT EXISTS first4_enc TEXT`,
  `ALTER TABLE statements ADD COLUMN IF NOT EXISTS stated_debits DOUBLE PRECISION`,
  `ALTER TABLE statements ADD COLUMN IF NOT EXISTS stated_credits DOUBLE PRECISION`,
  `ALTER TABLE statements ADD COLUMN IF NOT EXISTS paid_at TEXT`,
  `ALTER TABLE statements ADD COLUMN IF NOT EXISTS previous_balance DOUBLE PRECISION`,
  `ALTER TABLE transactions DROP COLUMN IF EXISTS txn_time`,
  // The month a statement belongs to, filled in for statements saved before it
  // existed. Same rule as statementMonthFor in bills.ts.
  `ALTER TABLE statements ADD COLUMN IF NOT EXISTS statement_month TEXT`,
  `UPDATE statements s SET statement_month = substr(COALESCE(
     s.statement_date,
     s.period_end,
     CASE WHEN length(s.due_date) = 10 THEN GREATEST(
       to_char(s.due_date::date - 20, 'YYYY-MM-DD'),
       COALESCE((SELECT MAX(t.txn_date) FROM transactions t WHERE t.statement_id = s.id), '')
     ) END,
     (SELECT MAX(t.txn_date) FROM transactions t WHERE t.statement_id = s.id),
     s.created_at
   ), 1, 7)
   WHERE s.statement_month IS NULL`,
  // Credits replaced "Payments & Refunds". A credit is always Credits, and a
  // charge that was filed there belongs nowhere in particular until reviewed.
  `UPDATE transactions SET category = 'Other' WHERE type = 'debit' AND category IN ('Payments & Refunds', 'Credits')`,
  `UPDATE transactions SET category = 'Credits' WHERE type = 'credit' AND category <> 'Credits'`,
  `DELETE FROM category_rules WHERE category IN ('Payments & Refunds', 'Credits')`,
];

function makePool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const local = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
  return new Pool({
    connectionString: url,
    ssl: local ? undefined : { rejectUnauthorized: true },
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
}

function wrap(run: (text: string, values: unknown[]) => Promise<{ rows: unknown[]; rowCount: number | null }>): Query {
  return async (text, values = []) => {
    const r = await run(text, values);
    return { rows: r.rows as Row[], rowsAffected: r.rowCount ?? 0 };
  };
}

async function init(p: Pool): Promise<void> {
  const c = await p.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(7314289)");
    for (const stmt of SCHEMA) await c.query(stmt);
    for (const stmt of MIGRATIONS) await c.query(stmt);
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

export async function db() {
  if (!pool) {
    const p = makePool();
    pool = p;
    ready = init(p).catch((e) => {
      pool = null;
      ready = null;
      void p.end().catch(() => {});
      throw e;
    });
  }
  await ready;
  const p = pool!;
  return {
    execute: wrap((text, values) => p.query(text, values)),
    async tx<T>(fn: (q: Query) => Promise<T>): Promise<T> {
      const c: PoolClient = await p.connect();
      try {
        await c.query("BEGIN");
        const out = await fn(wrap((text, values) => c.query(text, values)));
        await c.query("COMMIT");
        return out;
      } catch (e) {
        await c.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        c.release();
      }
    },
  };
}

export const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();
