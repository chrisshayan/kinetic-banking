/**
 * Kafka Consumer — Phase 2
 * Consumes mifos.clients, mifos.accounts, mifos.transactions → PostgreSQL
 */

import { resolve } from 'path';
import { config } from 'dotenv';
config({ path: resolve(process.cwd(), '../../.env') });

import { Kafka } from 'kafkajs';
import { Pool } from 'pg';
import { ensureCustomersIndex, indexCustomer } from './opensearch-sync.js';

const KAFKA_BROKERS = (process.env.KAFKA_BOOTSTRAP_SERVERS ?? 'localhost:9092').split(',');
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://kinetic:kinetic@localhost:5432/kinetic';

const kafka = new Kafka({ clientId: 'kinetic-consumer', brokers: KAFKA_BROKERS });
const pool = new Pool({ connectionString: DATABASE_URL });

const TOPICS = ['mifos.clients', 'mifos.accounts', 'mifos.transactions'] as const;

async function handleMessage(topic: string, message: string) {
  let parsed: { type?: string; payload?: Record<string, unknown> };
  try {
    parsed = JSON.parse(message);
  } catch {
    return;
  }
  const { type, payload } = parsed;
  if (!payload) return;

  try {
    if (topic === 'mifos.clients') {
      const id = String(payload.id);
      const display_name = String(payload.display_name ?? '');
      const status = String(payload.status ?? 'PENDING');
      await pool.query(
        `INSERT INTO customers (id, display_name, status, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (id) DO UPDATE SET display_name = $2, status = $3, updated_at = NOW()`,
        [id, display_name, status]
      );
      await indexCustomer({ id, display_name, status });
      console.log(`[mifos.clients] upserted ${id}`);
    } else if (topic === 'mifos.accounts') {
      const id = String(payload.id);
      const customer_id = String(payload.client_id ?? payload.customer_id ?? '');
      if (!customer_id) return;
      await pool.query(
        `INSERT INTO customers (id, display_name, status) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [customer_id, `Customer ${customer_id.slice(0, 8)}`, 'PENDING']
      );
      const product_type = String(payload.product_type ?? 'CHECKING');
      const status = String(payload.status ?? 'ACTIVE');
      const balance = Number(payload.balance ?? 0);
      const currency = String(payload.currency ?? 'USD');
      await pool.query(
        `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE SET customer_id = $2, product_type = $3, status = $4, balance = $5, currency = $6, updated_at = NOW()`,
        [id, customer_id, product_type, status, balance, currency]
      );
      console.log(`[mifos.accounts] upserted ${id}`);
    } else if (topic === 'mifos.transactions') {
      const id = String(payload.id);
      const account_id = String(payload.account_id ?? '');
      const type = String(payload.type ?? 'CREDIT');
      const amount = Number(payload.amount ?? 0);
      const balance_after = payload.balance_after != null ? Number(payload.balance_after) : null;
      const description = payload.description != null ? String(payload.description) : null;
      await pool.query(
        `INSERT INTO transactions (id, account_id, type, amount, balance_after, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::timestamptz, NOW()))
         ON CONFLICT (id) DO NOTHING`,
        [id, account_id, type, amount, balance_after, description, payload.created_at ?? null]
      );
      console.log(`[mifos.transactions] inserted ${id}`);
    }
  } catch (err) {
    console.error(`[${topic}] error:`, err);
  }
}

async function main() {
  console.log('Kafka consumer starting...');
  await pool.query('SELECT 1');
  console.log('PostgreSQL connected');
  await ensureCustomersIndex();
  console.log('OpenSearch index ready');

  const consumer = kafka.consumer({ groupId: 'kinetic-customer-truth' });
  await consumer.connect();

  for (const topic of TOPICS) {
    await consumer.subscribe({ topic, fromBeginning: true });
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const value = message.value?.toString();
      if (value) await handleMessage(topic, value);
    },
  });

  console.log('Consuming:', TOPICS.join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
