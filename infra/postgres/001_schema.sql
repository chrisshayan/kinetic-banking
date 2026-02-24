-- Phase 2: Shared Source of Customer Truth — PostgreSQL schema
-- Run: psql $DATABASE_URL -f infra/postgres/001_schema.sql

-- Customers (synced from Mifos clients + RudderStack)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  life_stage TEXT DEFAULT 'NEW_TO_BANK',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts (synced from Mifos)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  balance DECIMAL(18, 4) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (synced from Mifos)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL(18, 4) NOT NULL,
  balance_after DECIMAL(18, 4),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decision History (CLO + Coach outcomes — Outcome Feedback Loop)
CREATE TABLE IF NOT EXISTS decision_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  action TEXT NOT NULL,
  outcome TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Behavioral signals (from Kafka Streams or event processing)
CREATE TABLE IF NOT EXISTS behavioral_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_customer ON accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_decision_history_customer ON decision_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_decision_history_created ON decision_history(created_at);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_customer ON behavioral_signals(customer_id);
