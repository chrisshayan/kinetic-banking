/**
 * Seed demo data for Mifos mock
 * Run: pnpm seed
 */

import { initDb, db } from './db.js';
import { randomUUID } from 'crypto';

initDb();

const clients = [
  { display_name: 'Alice Johnson', status: 'ACTIVE' },
  { display_name: 'Bob Smith', status: 'ACTIVE' },
  { display_name: 'Carol Williams', status: 'PENDING' },
  { display_name: 'David Brown', status: 'ACTIVE' },
  { display_name: 'Eve Davis', status: 'ACTIVE' },
];

const productTypes = ['CHECKING', 'SAVINGS', 'CHECKING', 'SAVINGS', 'CHECKING'];

const insert = db.transaction(() => {
  const clientIds: string[] = [];
  for (const c of clients) {
    const id = randomUUID();
    db.prepare('INSERT INTO clients (id, display_name, status) VALUES (?, ?, ?)').run(id, c.display_name, c.status);
    clientIds.push(id);
  }

  const accountIds: string[] = [];
  clientIds.forEach((clientId, i) => {
    const id = randomUUID();
    const balance = 1000 + Math.random() * 5000;
    db.prepare(
      'INSERT INTO accounts (id, client_id, product_type, status, balance, currency) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, clientId, productTypes[i], 'ACTIVE', Math.round(balance * 100) / 100, 'USD');
    accountIds.push(id);
  });

  // Generate 50-100 transactions over last 90 days
  const types = ['CREDIT', 'DEBIT'];
  const descriptions = ['Salary', 'Transfer', 'Payment', 'Deposit', 'Withdrawal', 'Bill pay', 'ATM'];
  let balance = 0;
  for (let i = 0; i < 80; i++) {
    const accountId = accountIds[Math.floor(Math.random() * accountIds.length)];
    const account = db.prepare('SELECT balance FROM accounts WHERE id = ?').get(accountId) as { balance: number };
    const type = types[Math.floor(Math.random() * 2)];
    const amount = Math.round((50 + Math.random() * 500) * 100) / 100;
    balance = type === 'CREDIT' ? account.balance + amount : account.balance - amount;
    const daysAgo = Math.floor(Math.random() * 90);
    const created = new Date();
    created.setDate(created.getDate() - daysAgo);
    db.prepare(
      'INSERT INTO transactions (id, account_id, type, amount, balance_after, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      randomUUID(),
      accountId,
      type,
      amount,
      balance,
      descriptions[Math.floor(Math.random() * descriptions.length)],
      created.toISOString()
    );
  }

  // Update account balances from last transaction per account
  accountIds.forEach((aid) => {
    const last = db.prepare('SELECT balance_after FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT 1').get(aid) as { balance_after: number } | undefined;
    if (last) db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(last.balance_after, aid);
  });
});

insert();
console.log('Seed complete: 5 clients, 5 accounts, ~80 transactions');
