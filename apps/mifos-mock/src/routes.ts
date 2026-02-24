/**
 * REST routes for Mifos-like API
 */

import { Express } from 'express';
import { db } from './db.js';
import { emitEvent } from './kafka.js';
import { sendToRudderStack, identifyToRudderStack } from './rudderstack.js';
import { randomUUID } from 'crypto';

type KafkaProducer = Awaited<ReturnType<typeof import('./kafka.js').createKafkaProducer>>;

export function setupRoutes(app: Express, producer: KafkaProducer) {
  // Clients
  app.get('/clients', (_, res) => {
    const rows = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
    res.json(rows);
  });

  app.get('/clients/:id', (req, res) => {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    const accounts = db.prepare('SELECT * FROM accounts WHERE client_id = ?').all(req.params.id);
    res.json({ ...client, accounts });
  });

  app.post('/clients', async (req, res) => {
    const id = randomUUID();
    const { display_name, status = 'PENDING' } = req.body;
    db.prepare('INSERT INTO clients (id, display_name, status) VALUES (?, ?, ?)').run(id, display_name, status);
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as Record<string, unknown>;
    await emitEvent(producer, 'mifos.clients', 'client.created', client);
    await identifyToRudderStack(id, { display_name: client.display_name, status: client.status });
    await sendToRudderStack('client.created', id, client);
    res.status(201).json(client);
  });

  // Accounts
  app.get('/accounts', (req, res) => {
    const clientId = req.query.client_id;
    const sql = clientId ? 'SELECT * FROM accounts WHERE client_id = ?' : 'SELECT * FROM accounts';
    const rows = clientId ? db.prepare(sql).all(clientId) : db.prepare(sql).all();
    res.json(rows);
  });

  app.get('/accounts/:id', (req, res) => {
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  });

  app.post('/accounts', async (req, res) => {
    const id = randomUUID();
    const { client_id, product_type, status = 'ACTIVE', balance = 0, currency = 'USD' } = req.body;
    db.prepare(
      'INSERT INTO accounts (id, client_id, product_type, status, balance, currency) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, client_id, product_type, status, balance, currency);
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as Record<string, unknown>;
    await emitEvent(producer, 'mifos.accounts', 'account.opened', account);
    await sendToRudderStack('account.opened', client_id, account);
    res.status(201).json(account);
  });

  // Transactions
  app.get('/transactions', (req, res) => {
    const { account_id, limit = 50 } = req.query;
    const sql = account_id
      ? 'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT ?'
      : 'SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?';
    const rows = account_id ? db.prepare(sql).all(account_id, limit) : db.prepare(sql).all(limit);
    res.json(rows);
  });

  app.post('/transactions', async (req, res) => {
    const id = randomUUID();
    const { account_id, type, amount, description } = req.body;
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(account_id) as { balance: number } | undefined;
    if (!account) return res.status(404).json({ error: 'Account not found' });
    const balanceAfter = account.balance + (type === 'CREDIT' ? amount : -amount);
    db.prepare(
      'INSERT INTO transactions (id, account_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, account_id, type, amount, balanceAfter, description ?? '');
    db.prepare('UPDATE accounts SET balance = ?, updated_at = datetime("now") WHERE id = ?').run(balanceAfter, account_id);
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Record<string, unknown>;
    const acct = db.prepare('SELECT client_id FROM accounts WHERE id = ?').get(account_id) as { client_id: string } | undefined;
    await emitEvent(producer, 'mifos.transactions', 'transaction.completed', tx);
    await sendToRudderStack('transaction.completed', acct?.client_id ?? account_id, { ...tx, account_id });
    res.status(201).json(tx);
  });

  // Health
  app.get('/health', (_, res) => res.json({ status: 'ok', service: 'mifos-mock' }));
}
