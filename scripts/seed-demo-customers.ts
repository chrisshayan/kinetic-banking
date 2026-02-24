/**
 * Seed demo customers across all 4 CLO domains
 * Run: pnpm db:migrate && tsx scripts/seed-demo-customers.ts
 */
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://kinetic:kinetic@localhost:5432/kinetic',
});

async function main() {
  // Acquisition: PENDING, no accounts
  await pool.query(
    `INSERT INTO customers (id, display_name, status, life_stage) 
     VALUES ('demo-acquisition', 'Jordan Prospect', 'PENDING', 'PENDING')
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, status = EXCLUDED.status, life_stage = EXCLUDED.life_stage`
  );

  // Activation: 1 account, NEW_TO_BANK
  await pool.query(
    `INSERT INTO customers (id, display_name, status, life_stage) 
     VALUES ('demo-activation', 'Sam Newcomer', 'ACTIVE', 'NEW_TO_BANK')
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, status = EXCLUDED.status, life_stage = EXCLUDED.life_stage`
  );
  await pool.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency) 
     VALUES ('demo-activation-acc', 'demo-activation', 'CHECKING', 'ACTIVE', 500, 'USD')
     ON CONFLICT (id) DO UPDATE SET balance = EXCLUDED.balance`
  );

  // Expansion: 2+ accounts
  await pool.query(
    `INSERT INTO customers (id, display_name, status, life_stage) 
     VALUES ('demo-expansion', 'Alex Power User', 'ACTIVE', 'ACTIVE')
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, status = EXCLUDED.status, life_stage = EXCLUDED.life_stage`
  );
  await pool.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency) 
     VALUES ('demo-exp-1', 'demo-expansion', 'CHECKING', 'ACTIVE', 2000, 'USD'),
            ('demo-exp-2', 'demo-expansion', 'SAVINGS', 'ACTIVE', 5000, 'USD')
     ON CONFLICT (id) DO NOTHING`
  );

  // Retention: CHURN_RISK
  await pool.query(
    `INSERT INTO customers (id, display_name, status, life_stage) 
     VALUES ('demo-retention', 'Casey At Risk', 'ACTIVE', 'CHURN_RISK')
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, status = EXCLUDED.status, life_stage = EXCLUDED.life_stage`
  );
  await pool.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency) 
     VALUES ('demo-ret-acc', 'demo-retention', 'CHECKING', 'ACTIVE', 100, 'USD')
     ON CONFLICT (id) DO NOTHING`
  );

  console.log('Demo customers seeded:');
  console.log('  demo-acquisition  → ACQUISITION (sign_up, open_account)');
  console.log('  demo-activation  → ACTIVATION (complete_onboarding, first_transaction)');
  console.log('  demo-expansion   → EXPANSION (add_savings, apply_loan)');
  console.log('  demo-retention   → RETENTION (win_back, contact_branch)');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
