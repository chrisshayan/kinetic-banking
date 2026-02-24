/**
 * Outcome Feedback Loop — Writeback Consumer
 * Consumes decisions.outcomes from Kafka → Decision History (PostgreSQL)
 * Optional: state update, MLflow retraining trigger
 */

import { resolve } from 'path';
import { config } from 'dotenv';
config({ path: resolve(process.cwd(), '../../.env') });

import { Kafka } from 'kafkajs';
import { Pool } from 'pg';

const KAFKA_BROKERS = (process.env.KAFKA_BOOTSTRAP_SERVERS ?? 'localhost:9092').split(',');
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://kinetic:kinetic@localhost:5432/kinetic';
const MLFLOW_TRACKING_URI = process.env.MLFLOW_TRACKING_URI ?? 'http://localhost:5001';

const kafka = new Kafka({ clientId: 'kinetic-writeback', brokers: KAFKA_BROKERS });
const pool = new Pool({ connectionString: DATABASE_URL });

const TOPIC = 'decisions.outcomes';

async function handleDecisionOutcome(message: string) {
  let parsed: { type?: string; payload?: Record<string, unknown>; timestamp?: string };
  try {
    parsed = JSON.parse(message);
  } catch {
    return;
  }
  const { payload } = parsed;
  if (!payload || typeof payload !== 'object') return;

  const customer_id = String(payload.customer_id ?? '');
  const domain = String(payload.domain ?? '');
  const action = String(payload.action ?? '');
  const outcome = payload.outcome != null ? String(payload.outcome) : 'recommended';
  const metadata = payload.metadata && typeof payload.metadata === 'object'
    ? payload.metadata
    : {};

  if (!customer_id || !domain || !action) {
    console.warn('[writeback] Skipping message: missing customer_id, domain, or action');
    return;
  }

  try {
    await pool.query(
      `INSERT INTO decision_history (customer_id, domain, action, outcome, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()))`,
      [
        customer_id,
        domain,
        action,
        outcome,
        JSON.stringify(metadata),
        parsed.timestamp ?? null,
      ]
    );
    console.log(`[writeback] decision_history: ${customer_id} ${domain}/${action} (${outcome})`);

    if (outcome === 'accepted') {
      await pool.query(
        `UPDATE customers SET updated_at = NOW() WHERE id = $1`,
        [customer_id]
      );
    }

    triggerRetrainingFlag(customer_id, domain, action).catch(() => {});
  } catch (err) {
    console.error('[writeback] Insert failed:', err);
    throw err;
  }
}

async function triggerRetrainingFlag(customerId: string, domain: string, action: string) {
  try {
    const res = await fetch(`${MLFLOW_TRACKING_URI}/api/2.0/mlflow/experiments/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ view_type: 'ACTIVE_ONLY' }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const exp = data.experiments?.find((e: { name: string }) => e.name === 'kinetic-health-score');
    if (exp) {
      await fetch(`${MLFLOW_TRACKING_URI}/api/2.0/mlflow/runs/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiment_id: exp.experiment_id,
          run_name: `feedback-${Date.now()}`,
          tags: [
            { key: 'source', value: 'writeback' },
            { key: 'customer_id', value: customerId },
            { key: 'domain', value: domain },
            { key: 'action', value: action },
          ],
        }),
      });
    }
  } catch {
    // MLflow unreachable — non-fatal
  }
}

async function main() {
  console.log('Writeback service starting...');
  await pool.query('SELECT 1');
  console.log('PostgreSQL connected');

  const consumer = kafka.consumer({ groupId: 'kinetic-writeback' });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const value = message.value?.toString();
      if (value) await handleDecisionOutcome(value);
    },
  });

  console.log(`Consuming: ${TOPIC}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
