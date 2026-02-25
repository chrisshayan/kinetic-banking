import { NextRequest, NextResponse } from 'next/server';
import { runCLO } from '@/lib/agents/clo-agent';
import { getCustomerById, getAccountsByCustomerId, getDecisionHistory } from '@/lib/db';
import { checkGuardrails } from '@/lib/opa';
import { publishDecisionOutcome } from '@/lib/kafka';
import { logCLODecision } from '@/lib/mlflow';
import { getNeo4jBrowserUrl, getNeo4jBrowserUrlForLifeStage, getNeo4jBrowserUrlForPath } from '@/lib/ontology';

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

    const nba = await runCLO(customerId, truth);

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

    const published = await publishDecisionOutcome({
      customer_id: customerId,
      domain: nba.domain,
      action: nba.action,
      outcome: 'recommended',
      metadata: { confidence: nba.confidence, reasoning: nba.reasoning },
    });
    if (!published) {
      const { insertDecision } = await import('@/lib/db');
      await insertDecision(customerId, nba.domain, nba.action, {
        confidence: nba.confidence,
        reasoning: nba.reasoning,
      });
    }

    logCLODecision({
      customerId,
      domain: nba.domain,
      action: nba.action,
      confidence: nba.confidence,
      ontologyDriven: nba.ontologyDriven,
    }).catch(() => {});

    return NextResponse.json({
      ...nba,
      neo4jBrowserUrl: nba.ontologyDriven ? getNeo4jBrowserUrl(nba.domain) : undefined,
      neo4jTriggersUrl:
        nba.ontologyDriven && nba.lifeStage
          ? getNeo4jBrowserUrlForLifeStage(nba.lifeStage)
          : undefined,
      neo4jPathUrl:
        nba.ontologyDriven && nba.lifeStage
          ? getNeo4jBrowserUrlForPath(nba.lifeStage, nba.domain)
          : undefined,
    });
  } catch (err) {
    console.error('[clo/nba]', err);
    return NextResponse.json(
      { error: 'Failed to get NBA' },
      { status: 500 }
    );
  }
}
