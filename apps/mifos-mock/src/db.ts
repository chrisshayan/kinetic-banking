/**
 * SQLite database for Mifos mock (swappable for PostgreSQL)
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, 'mifos.db'));

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      product_type TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_after REAL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );

    CREATE INDEX IF NOT EXISTS idx_accounts_client ON accounts(client_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
  `);
}

export { db };
