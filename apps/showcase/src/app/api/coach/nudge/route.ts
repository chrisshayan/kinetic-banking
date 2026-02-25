import { NextRequest, NextResponse } from 'next/server';
import { runCoachNudge } from '@/lib/agents/coach-agent';
import { getCustomerById, getAccountsByCustomerId } from '@/lib/db';
import { getHealthScore } from '@/lib/health-score';
import { getCustomerPeerFeatures } from '@/lib/db';
import { logCoachNudge } from '@/lib/mlflow';

const COACH_DOMAINS = [
  'health_assessment',
  'anomaly_detection',
  'peer_benchmarking',
  'early_warnings',
  'weekly_reflection',
] as const;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const customerId = body.customerId ?? 'demo-activation';
  const domain = body.domain ?? 'weekly_reflection';

  if (!COACH_DOMAINS.includes(domain)) {
    return NextResponse.json(
      { error: 'Invalid domain', valid: COACH_DOMAINS },
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

    const [accounts, healthResult, peerFeatures] = await Promise.all([
      getAccountsByCustomerId(customerId),
      getHealthScore(customerId),
      getCustomerPeerFeatures(customerId),
    ]);
    const truth = {
      id: customer.id,
      displayName: customer.display_name,
      accounts: accounts.map((a) => ({
        balance: Number(a.balance),
        productType: a.product_type,
      })),
      healthScore: healthResult?.score,
      features: healthResult?.features,
      peerFeatures: peerFeatures ?? undefined,
    };

    const result = runCoachNudge(customerId, domain, truth);

    logCoachNudge({
      customerId,
      domain,
      type: result.type,
    }).catch(() => {});

    return NextResponse.json({
      ...result,
      healthSource: healthResult?.source,
    });
  } catch (err) {
    console.error('[coach/nudge]', err);
    return NextResponse.json(
      { error: 'Failed to generate nudge' },
      { status: 500 }
    );
  }
}
