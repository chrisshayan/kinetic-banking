import { NextRequest, NextResponse } from 'next/server';
import { runCLO } from '@/lib/agents/clo-agent';
import { getCustomerById, getAccountsByCustomerId, getDecisionHistory, insertDecision } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const customerId = body.customerId ?? '';

  if (!customerId) {
    return NextResponse.json(
      { error: 'customerId is required' },
      { status: 400 }
    );
  }

  try {
    const customer = await getCustomerById(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found', customerId },
        { status: 404 }
      );
    }

    const [accounts, decisionHistory] = await Promise.all([
      getAccountsByCustomerId(customerId),
      getDecisionHistory(customerId),
    ]);

    const truth = {
      id: customer.id,
      displayName: customer.display_name,
      lifeStage: customer.life_stage || customer.status,
      accounts: accounts.map((a) => ({
        id: a.id,
        productType: a.product_type,
        status: a.status,
      })),
      decisionHistory: decisionHistory.map((d) => ({
        domain: d.domain,
        action: d.action,
      })),
    };

    const nba = runCLO(customerId, truth);

    await insertDecision(customerId, nba.domain, nba.action, {
      confidence: nba.confidence,
      reasoning: nba.reasoning,
    });

    return NextResponse.json(nba);
  } catch (err) {
    console.error('[clo/nba]', err);
    return NextResponse.json(
      { error: 'Failed to get NBA' },
      { status: 500 }
    );
  }
}
