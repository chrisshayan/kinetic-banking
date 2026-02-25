import { NextResponse } from 'next/server';

const SCENARIOS = [
  { id: 'sarah-chen', name: 'Sarah Chen', domain: 'EXPANSION', desc: 'ACTIVE, 3 accounts. Done: open_term_deposit, open_credit_card → set_up_budget' },
  { id: 'demo-acquisition', name: 'Jordan Prospect', domain: 'ACQUISITION', desc: 'PENDING, no accounts → sign_up or open_account' },
  { id: 'demo-activation', name: 'Sam Newcomer', domain: 'ACTIVATION', desc: 'NEW_TO_BANK, 1 account → complete_onboarding, first_transaction' },
  { id: 'demo-expansion', name: 'Alex Power User', domain: 'EXPANSION', desc: 'ACTIVE, 2 accounts. Fresh → add_savings (first in ontology)' },
  { id: 'demo-retention', name: 'Casey At Risk', domain: 'RETENTION', desc: 'CHURN_RISK, 1 account → win_back, retention_offer' },
  { id: 'peer-top-25', name: 'Morgan Top Saver', domain: 'EXPANSION', desc: 'ACTIVE, top 25% of peers — try Coach "compare"' },
  { id: 'peer-median', name: 'Riley Middle Ground', domain: 'EXPANSION', desc: 'ACTIVE, median of peers' },
  { id: 'peer-bottom-25', name: 'Jordan Building Up', domain: 'EXPANSION', desc: 'ACTIVE, bottom 25% — room to grow' },
  { id: 'peer-new-top', name: 'Sam Strong Start', domain: 'ACTIVATION', desc: 'NEW_TO_BANK, top of segment' },
  { id: 'peer-churn-low', name: 'Casey Needs Help', domain: 'RETENTION', desc: 'CHURN_RISK, low vs at-risk peers' },
];

export async function GET() {
  return NextResponse.json(SCENARIOS);
}
