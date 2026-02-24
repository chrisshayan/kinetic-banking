import { NextRequest, NextResponse } from 'next/server';
import { runCLO } from '@/lib/agents/clo-agent';
import { getCustomerById, getAccountsByCustomerId, getDecisionHistory, insertDecision } from '@/lib/db';
import { checkGuardrails } from '@/lib/opa';

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

    const accountStatus = accounts.some((a) => a.status === 'ACTIVE') ? 'ACTIVE' : accounts[0]?.status ?? 'UNKNOWN';
    const guard = await checkGuardrails({
      account_status: accountStatus,
      confidence: nba.confidence,
      domain: nba.domain,
      action: nba.action,
    });
    if (!guard.allowed) {
      return NextResponse.json(
        { error: 'Guardrail denied', reason: guard.reason, nba },
        { status: 403 }
      );
    }

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
