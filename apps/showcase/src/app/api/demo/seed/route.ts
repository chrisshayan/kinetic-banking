import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

/**
 * Seed Sarah's journey for demo.
 * Idempotent — safe to call multiple times.
 */
export async function POST() {
  try {
    const customerId = 'sarah-chen';
    const now = new Date();
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
    const sixWeeksAgo = new Date(now);
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
    const threeWeeksAgo = new Date(now);
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    await pool.query(
      `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET display_name = $2, status = $3, life_stage = $4, updated_at = $6`,
      [customerId, 'Sarah Chen', 'ACTIVE', 'ACTIVE', twoMonthsAgo, now]
    );

    await pool.query(
      `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET balance = $5, status = $4`,
      ['acc-932021', customerId, 'CURRENT', 'ACTIVE', 3847.52, 'USD', twoMonthsAgo]
    );
    await pool.query(`UPDATE accounts SET account_number = '***932021' WHERE id = 'acc-932021'`).catch(() => {});

    await pool.query(
      `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET balance = $5, status = $4`,
      ['acc-td-001', customerId, 'TERM_DEPOSIT', 'ACTIVE', 10000.0, 'USD', sixWeeksAgo]
    );
    await pool.query(`UPDATE accounts SET account_number = 'TD-784291' WHERE id = 'acc-td-001'`).catch(() => {});

    await pool.query(
      `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET balance = $5, status = $4`,
      ['acc-cc-001', customerId, 'CREDIT_CARD', 'ACTIVE', -423.18, 'USD', threeWeeksAgo]
    );
    await pool.query(`UPDATE accounts SET account_number = '****4521' WHERE id = 'acc-cc-001'`).catch(() => {});

    const txns = [
      ['tx-1', 'acc-932021', 'CREDIT', 2500, 'Salary credit'],
      ['tx-2', 'acc-932021', 'DEBIT', -89.99, 'Groceries'],
      ['tx-3', 'acc-932021', 'DEBIT', -45, 'Utilities'],
      ['tx-4', 'acc-932021', 'DEBIT', -120, 'Restaurant'],
    ];
    for (const [id, acc, type, amt, desc] of txns) {
      await pool.query(
        `INSERT INTO transactions (id, account_id, type, amount, description, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id) DO NOTHING`,
        [id, acc, type, amt, desc]
      );
    }

    await pool.query(`DELETE FROM decision_history WHERE customer_id = $1`, [customerId]);
    const decisions = [
      { domain: 'ACQUISITION', action: 'sign_up', outcome: 'accepted', when: twoMonthsAgo },
      { domain: 'ACTIVATION', action: 'open_current_account', outcome: 'accepted', when: twoMonthsAgo },
      { domain: 'ACTIVATION', action: 'complete_onboarding', outcome: 'accepted', when: new Date(twoMonthsAgo.getTime() + 2 * 24 * 60 * 60 * 1000) },
      { domain: 'EXPANSION', action: 'open_term_deposit', outcome: 'accepted', when: sixWeeksAgo },
      { domain: 'EXPANSION', action: 'open_credit_card', outcome: 'accepted', when: threeWeeksAgo },
    ];
    for (const d of decisions) {
      await pool.query(
        `INSERT INTO decision_history (customer_id, domain, action, outcome, metadata, created_at)
         VALUES ($1, $2, $3, $4, '{}', $5)`,
        [customerId, d.domain, d.action, d.outcome, d.when]
      );
    }

    return NextResponse.json({ ok: true, customerId: 'sarah-chen' });
  } catch (err) {
    console.error('[demo/seed]', err);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
