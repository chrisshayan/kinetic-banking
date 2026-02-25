import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

const SCENARIOS = [
  {
    id: 'sarah-chen',
    name: 'Sarah Chen',
    domain: 'EXPANSION',
    desc: 'ACTIVE, 3 accounts. Done: open_term_deposit, open_credit_card → selects set_up_budget',
  },
  {
    id: 'demo-acquisition',
    name: 'Jordan Prospect',
    domain: 'ACQUISITION',
    desc: 'PENDING, no accounts → sign_up or open_account',
  },
  {
    id: 'demo-activation',
    name: 'Sam Newcomer',
    domain: 'ACTIVATION',
    desc: 'NEW_TO_BANK, 1 account → complete_onboarding, first_transaction',
  },
  {
    id: 'demo-expansion',
    name: 'Alex Power User',
    domain: 'EXPANSION',
    desc: 'ACTIVE, 2 accounts. Fresh → selects add_savings (first in ontology)',
  },
  {
    id: 'demo-retention',
    name: 'Casey At Risk',
    domain: 'RETENTION',
    desc: 'CHURN_RISK, 1 account → win_back, retention_offer',
  },
  // Peer benchmarking scenarios (use Coach "compare" or "benchmark" to see percentile-based replies)
  {
    id: 'peer-top-25',
    name: 'Morgan Top Saver',
    domain: 'EXPANSION',
    desc: 'ACTIVE, top 25% of peers — high balance vs segment',
  },
  {
    id: 'peer-median',
    name: 'Riley Middle Ground',
    domain: 'EXPANSION',
    desc: 'ACTIVE, median of peers — average for segment',
  },
  {
    id: 'peer-bottom-25',
    name: 'Jordan Building Up',
    domain: 'EXPANSION',
    desc: 'ACTIVE, bottom 25% — room to grow vs peers',
  },
  {
    id: 'peer-new-top',
    name: 'Sam Strong Start',
    domain: 'ACTIVATION',
    desc: 'NEW_TO_BANK, top of segment — ahead of new customers',
  },
  {
    id: 'peer-churn-low',
    name: 'Casey Needs Help',
    domain: 'RETENTION',
    desc: 'CHURN_RISK, low balance vs at-risk peers',
  },
] as const;

/**
 * Seed all demo scenarios. Idempotent — safe to call multiple times.
 * POST body: { scenario?: string } — if provided, only seeds that scenario.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const scenarioId = body.scenario as string | undefined;
    const now = new Date();
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
    const sixWeeksAgo = new Date(now);
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
    const threeWeeksAgo = new Date(now);
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const toSeed = scenarioId
      ? SCENARIOS.filter((s) => s.id === scenarioId)
      : SCENARIOS;

    await seedPeerPool(pool, now);

    for (const s of toSeed) {
      if (s.id === 'sarah-chen') {
        await seedSarah(pool, now, twoMonthsAgo, sixWeeksAgo, threeWeeksAgo);
      } else if (s.id === 'demo-acquisition') {
        await seedAcquisition(pool, now);
      } else if (s.id === 'demo-activation') {
        await seedActivation(pool, now);
      } else if (s.id === 'demo-expansion') {
        await seedExpansion(pool, now);
      } else if (s.id === 'demo-retention') {
        await seedRetention(pool, now);
      } else if (s.id === 'peer-top-25') {
        await seedPeerTop25(pool, now);
      } else if (s.id === 'peer-median') {
        await seedPeerMedian(pool, now);
      } else if (s.id === 'peer-bottom-25') {
        await seedPeerBottom25(pool, now);
      } else if (s.id === 'peer-new-top') {
        await seedPeerNewTop(pool, now);
      } else if (s.id === 'peer-churn-low') {
        await seedPeerChurnLow(pool, now);
      }
    }

    return NextResponse.json({
      ok: true,
      scenarios: toSeed.map((s) => s.id),
    });
  } catch (err) {
    console.error('[demo/seed]', err);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}

async function seedSarah(
  db: typeof pool,
  now: Date,
  twoMonthsAgo: Date,
  sixWeeksAgo: Date,
  threeWeeksAgo: Date
) {
  const customerId = 'sarah-chen';
  await db.query(
    `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET display_name = $2, status = $3, life_stage = $4, updated_at = $6`,
    [customerId, 'Sarah Chen', 'ACTIVE', 'ACTIVE', twoMonthsAgo, now]
  );
  await db.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET balance = $5, status = $4`,
    ['acc-932021', customerId, 'CURRENT', 'ACTIVE', 3847.52, 'USD', twoMonthsAgo]
  );
  await db.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET balance = $5, status = $4`,
    ['acc-td-001', customerId, 'TERM_DEPOSIT', 'ACTIVE', 10000.0, 'USD', sixWeeksAgo]
  );
  await db.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET balance = $5, status = $4`,
    ['acc-cc-001', customerId, 'CREDIT_CARD', 'ACTIVE', -423.18, 'USD', threeWeeksAgo]
  );
  const txns = [
    ['tx-1', 'acc-932021', 'CREDIT', 2500, 'Salary credit'],
    ['tx-2', 'acc-932021', 'DEBIT', -89.99, 'Groceries'],
    ['tx-3', 'acc-932021', 'DEBIT', -45, 'Utilities'],
    ['tx-4', 'acc-932021', 'DEBIT', -120, 'Restaurant'],
  ];
  for (const [id, acc, type, amt, desc] of txns) {
    await db.query(
      `INSERT INTO transactions (id, account_id, type, amount, description, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [id, acc, type, amt, desc]
    );
  }
  await db.query(`DELETE FROM decision_history WHERE customer_id = $1`, [customerId]);
  const decisions = [
    { domain: 'ACQUISITION', action: 'sign_up', outcome: 'accepted', when: twoMonthsAgo },
    { domain: 'ACTIVATION', action: 'open_current_account', outcome: 'accepted', when: twoMonthsAgo },
    { domain: 'ACTIVATION', action: 'complete_onboarding', outcome: 'accepted', when: new Date(twoMonthsAgo.getTime() + 2 * 24 * 60 * 60 * 1000) },
    { domain: 'EXPANSION', action: 'open_term_deposit', outcome: 'accepted', when: sixWeeksAgo },
    { domain: 'EXPANSION', action: 'open_credit_card', outcome: 'accepted', when: threeWeeksAgo },
  ];
  for (const d of decisions) {
    await db.query(
      `INSERT INTO decision_history (customer_id, domain, action, outcome, metadata, created_at)
       VALUES ($1, $2, $3, $4, '{}', $5)`,
      [customerId, d.domain, d.action, d.outcome, d.when]
    );
  }
}

async function seedAcquisition(db: typeof pool, now: Date) {
  await db.query(
    `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
     VALUES ('demo-acquisition', 'Jordan Prospect', 'PENDING', 'PENDING', $1, $2)
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, status = EXCLUDED.status, life_stage = EXCLUDED.life_stage, updated_at = EXCLUDED.updated_at`,
    [now, now]
  );
  await db.query(`DELETE FROM accounts WHERE customer_id = 'demo-acquisition'`);
  await db.query(`DELETE FROM decision_history WHERE customer_id = 'demo-acquisition'`);
}

async function seedActivation(db: typeof pool, now: Date) {
  await db.query(
    `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
     VALUES ('demo-activation', 'Sam Newcomer', 'ACTIVE', 'NEW_TO_BANK', $1, $2)
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, status = EXCLUDED.status, life_stage = EXCLUDED.life_stage, updated_at = EXCLUDED.updated_at`,
    [now, now]
  );
  await db.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ('demo-activation-acc', 'demo-activation', 'CURRENT', 'ACTIVE', 500, 'USD', $1)
     ON CONFLICT (id) DO UPDATE SET balance = EXCLUDED.balance, status = EXCLUDED.status`,
    [now]
  );
  await db.query(`DELETE FROM decision_history WHERE customer_id = 'demo-activation'`);
}

async function seedExpansion(db: typeof pool, now: Date) {
  await db.query(
    `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
     VALUES ('demo-expansion', 'Alex Power User', 'ACTIVE', 'ACTIVE', $1, $2)
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, status = EXCLUDED.status, life_stage = EXCLUDED.life_stage, updated_at = EXCLUDED.updated_at`,
    [now, now]
  );
  await db.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ('demo-exp-1', 'demo-expansion', 'CURRENT', 'ACTIVE', 2000, 'USD', $1),
            ('demo-exp-2', 'demo-expansion', 'SAVINGS', 'ACTIVE', 5000, 'USD', $1)
     ON CONFLICT (id) DO UPDATE SET balance = EXCLUDED.balance, status = EXCLUDED.status`,
    [now]
  );
  await db.query(`DELETE FROM decision_history WHERE customer_id = 'demo-expansion'`);
}

async function seedRetention(db: typeof pool, now: Date) {
  await db.query(
    `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
     VALUES ('demo-retention', 'Casey At Risk', 'ACTIVE', 'CHURN_RISK', $1, $2)
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, status = EXCLUDED.status, life_stage = EXCLUDED.life_stage, updated_at = EXCLUDED.updated_at`,
    [now, now]
  );
  await db.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ('demo-ret-acc', 'demo-retention', 'CURRENT', 'ACTIVE', 100, 'USD', $1)
     ON CONFLICT (id) DO UPDATE SET balance = EXCLUDED.balance, status = EXCLUDED.status`,
    [now]
  );
  await db.query(`DELETE FROM decision_history WHERE customer_id = 'demo-retention'`);
}

/** Seed diverse peer pool for percentile computation. Run before scenario seeds. */
async function seedPeerPool(db: typeof pool, now: Date) {
  const activePeers = [
    ['peer-active-1', 1000],
    ['peer-active-2', 2000],
    ['peer-active-3', 3000],
    ['peer-active-4', 4000],
    ['peer-active-5', 5000],
    ['peer-active-6', 6000],
    ['peer-active-7', 7000],
    ['peer-active-8', 8000],
    ['peer-active-9', 10000],
    ['peer-active-10', 12000],
  ];
  for (const [id, bal] of activePeers) {
    await db.query(
      `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
       VALUES ($1, $2, 'ACTIVE', 'ACTIVE', $3, $4)
       ON CONFLICT (id) DO UPDATE SET life_stage = 'ACTIVE', updated_at = $4`,
      [id, `Peer ${id}`, now, now]
    );
    await db.query(
      `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
       VALUES ($1, $2, 'CURRENT', 'ACTIVE', $3, 'USD', $4)
       ON CONFLICT (id) DO UPDATE SET balance = $3`,
      [`acc-${id}`, id, bal, now]
    );
  }
  const newPeers = [
    ['peer-new-1', 200],
    ['peer-new-2', 800],
    ['peer-new-3', 1500],
    ['peer-new-4', 3000],
    ['peer-new-5', 5000],
  ];
  for (const [id, bal] of newPeers) {
    await db.query(
      `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
       VALUES ($1, $2, 'ACTIVE', 'NEW_TO_BANK', $3, $4)
       ON CONFLICT (id) DO UPDATE SET life_stage = 'NEW_TO_BANK', updated_at = $4`,
      [id, `Peer ${id}`, now, now]
    );
    await db.query(
      `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
       VALUES ($1, $2, 'CURRENT', 'ACTIVE', $3, 'USD', $4)
       ON CONFLICT (id) DO UPDATE SET balance = $3`,
      [`acc-${id}`, id, bal, now]
    );
  }
  const churnPeers = [
    ['peer-churn-1', 50],
    ['peer-churn-2', 200],
    ['peer-churn-3', 500],
    ['peer-churn-4', 800],
  ];
  for (const [id, bal] of churnPeers) {
    await db.query(
      `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
       VALUES ($1, $2, 'ACTIVE', 'CHURN_RISK', $3, $4)
       ON CONFLICT (id) DO UPDATE SET life_stage = 'CHURN_RISK', updated_at = $4`,
      [id, `Peer ${id}`, now, now]
    );
    await db.query(
      `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
       VALUES ($1, $2, 'CURRENT', 'ACTIVE', $3, 'USD', $4)
       ON CONFLICT (id) DO UPDATE SET balance = $3`,
      [`acc-${id}`, id, bal, now]
    );
  }
  // Seed peer scenario customers so they're always available (Coach, Layer Explorer)
  await seedPeerTop25(db, now);
  await seedPeerMedian(db, now);
  await seedPeerBottom25(db, now);
  await seedPeerNewTop(db, now);
  await seedPeerChurnLow(db, now);
}

async function seedPeerTop25(db: typeof pool, now: Date) {
  await db.query(
    `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
     VALUES ('peer-top-25', 'Morgan Top Saver', 'ACTIVE', 'ACTIVE', $1, $2)
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, life_stage = 'ACTIVE', updated_at = $2`,
    [now, now]
  );
  await db.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ('acc-peer-top-25', 'peer-top-25', 'CURRENT', 'ACTIVE', 22000, 'USD', $1)
     ON CONFLICT (id) DO UPDATE SET balance = 22000`,
    [now]
  );
  await db.query(`DELETE FROM decision_history WHERE customer_id = 'peer-top-25'`);
}

async function seedPeerMedian(db: typeof pool, now: Date) {
  await db.query(
    `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
     VALUES ('peer-median', 'Riley Middle Ground', 'ACTIVE', 'ACTIVE', $1, $2)
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, life_stage = 'ACTIVE', updated_at = $2`,
    [now, now]
  );
  await db.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ('acc-peer-median', 'peer-median', 'CURRENT', 'ACTIVE', 7500, 'USD', $1)
     ON CONFLICT (id) DO UPDATE SET balance = 7500`,
    [now]
  );
  await db.query(`DELETE FROM decision_history WHERE customer_id = 'peer-median'`);
}

async function seedPeerBottom25(db: typeof pool, now: Date) {
  await db.query(
    `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
     VALUES ('peer-bottom-25', 'Jordan Building Up', 'ACTIVE', 'ACTIVE', $1, $2)
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, life_stage = 'ACTIVE', updated_at = $2`,
    [now, now]
  );
  await db.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ('acc-peer-bottom-25', 'peer-bottom-25', 'CURRENT', 'ACTIVE', 1500, 'USD', $1)
     ON CONFLICT (id) DO UPDATE SET balance = 1500`,
    [now]
  );
  await db.query(`DELETE FROM decision_history WHERE customer_id = 'peer-bottom-25'`);
}

async function seedPeerNewTop(db: typeof pool, now: Date) {
  await db.query(
    `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
     VALUES ('peer-new-top', 'Sam Strong Start', 'ACTIVE', 'NEW_TO_BANK', $1, $2)
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, life_stage = 'NEW_TO_BANK', updated_at = $2`,
    [now, now]
  );
  await db.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ('acc-peer-new-top', 'peer-new-top', 'CURRENT', 'ACTIVE', 4500, 'USD', $1)
     ON CONFLICT (id) DO UPDATE SET balance = 4500`,
    [now]
  );
  await db.query(`DELETE FROM decision_history WHERE customer_id = 'peer-new-top'`);
}

async function seedPeerChurnLow(db: typeof pool, now: Date) {
  await db.query(
    `INSERT INTO customers (id, display_name, status, life_stage, created_at, updated_at)
     VALUES ('peer-churn-low', 'Casey Needs Help', 'ACTIVE', 'CHURN_RISK', $1, $2)
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, life_stage = 'CHURN_RISK', updated_at = $2`,
    [now, now]
  );
  await db.query(
    `INSERT INTO accounts (id, customer_id, product_type, status, balance, currency, created_at)
     VALUES ('acc-peer-churn-low', 'peer-churn-low', 'CURRENT', 'ACTIVE', 75, 'USD', $1)
     ON CONFLICT (id) DO UPDATE SET balance = 75`,
    [now]
  );
  await db.query(`DELETE FROM decision_history WHERE customer_id = 'peer-churn-low'`);
}
