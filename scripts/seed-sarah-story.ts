/**
 * Seed Sarah's journey — a realistic customer story
 * Run: pnpm run db:seed-sarah
 *
 * Story: Sarah onboarded → opened current account ***932021 → term deposit (4.5% APY) → credit card with Apple Pay
 */
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://kinetic:kinetic@localhost:5432/kinetic',
});

async function main() {
  const customerId = 'sarah-chen';
  const now = new Date();
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
  const sixWeeksAgo = new Date(now);
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
  const threeWeeksAgo = new Date(now);
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

  // 1. Sarah Chen — onboarded 2 months ago
  await pool.query(
    `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET display_name = $2, status = $3, life_stage = $4, updated_at = $6`,
    [customerId, 'Sarah Chen', 'ACTIVE', 'ACTIVE', twoMonthsAgo, now]
  );

  // 2. Current account ***932021 — opened at onboarding (beautiful number)
  await pool.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET balance = $5, status = $4, updated_at = NOW()`,
    ['acc-932021', customerId, 'CURRENT', 'ACTIVE', 3847.52, 'USD', twoMonthsAgo]
  );

  await pool.query(
    `UPDATE accounts SET account_number = '***932021' WHERE id = 'acc-932021'`
  );

  // 3. Term deposit — opened 6 weeks ago, 4.5% APY, matures in 12 months
  await pool.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET balance = $5, status = $4`,
    ['acc-td-001', customerId, 'TERM_DEPOSIT', 'ACTIVE', 10000.0, 'USD', sixWeeksAgo]
  );
  await pool.query(
    `UPDATE accounts SET account_number = 'TD-784291' WHERE id = 'acc-td-001'`
  );

  // 4. Credit card — opened 3 weeks ago, Apple Pay enabled
  await pool.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET balance = $5, status = $4`,
    ['acc-cc-001', customerId, 'CREDIT_CARD', 'ACTIVE', -423.18, 'USD', threeWeeksAgo]
  );
  await pool.query(
    `UPDATE accounts SET account_number = '****4521' WHERE id = 'acc-cc-001'`
  );

  // 5. Transactions on current account (recent activity)
  const txns = [
    { id: 'tx-1', amount: 2500, desc: 'Salary credit', type: 'CREDIT', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
    { id: 'tx-2', amount: -89.99, desc: 'Groceries', type: 'DEBIT', date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    { id: 'tx-3', amount: -45.00, desc: 'Utilities', type: 'DEBIT', date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
    { id: 'tx-4', amount: -120.00, desc: 'Restaurant', type: 'DEBIT', date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
  ];
  for (const t of txns) {
    await pool.query(
      `INSERT INTO transactions (id, account_id, type, amount, description, created_at)
       VALUES ($1, 'acc-932021', $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [t.id, t.type, t.amount, t.desc, t.date]
    );
  }

  // 6. Decision history — the journey we orchestrated
  const decisions = [
    { domain: 'ACQUISITION', action: 'sign_up', outcome: 'accepted', when: twoMonthsAgo, meta: {} },
    { domain: 'ACTIVATION', action: 'open_current_account', outcome: 'accepted', when: twoMonthsAgo, meta: { accountNumber: '932021', beautifulNumber: true } },
    { domain: 'ACTIVATION', action: 'complete_onboarding', outcome: 'accepted', when: new Date(twoMonthsAgo.getTime() + 2 * 24 * 60 * 60 * 1000), meta: {} },
    { domain: 'EXPANSION', action: 'open_term_deposit', outcome: 'accepted', when: sixWeeksAgo, meta: { apy: 4.5, amount: 10000, termMonths: 12 } },
    { domain: 'EXPANSION', action: 'open_credit_card', outcome: 'accepted', when: threeWeeksAgo, meta: { applePay: true } },
  ];
  await pool.query(`DELETE FROM decision_history WHERE customer_id = $1`, [customerId]);
  for (const d of decisions) {
    await pool.query(
      `INSERT INTO decision_history (customer_id, domain, action, outcome, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [customerId, d.domain, d.action, d.outcome, JSON.stringify(d.meta), d.when]
    );
  }

  console.log("Sarah's journey seeded:");
  console.log('  Customer ID: sarah-chen');
  console.log('  Current account: ***932021 ($3,847.52)');
  console.log('  Term deposit: TD-784291 ($10,000 @ 4.5% APY)');
  console.log('  Credit card: ****4521 (Apple Pay)');
  console.log('  Fetch: http://localhost:3000/api/customer-truth/sarah-chen');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
