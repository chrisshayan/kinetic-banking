import { NextRequest, NextResponse } from 'next/server';
import { runCoachChat } from '@/lib/agents/coach-agent';
import { getCustomerById, getAccountsByCustomerId } from '@/lib/db';
import { getHealthScore } from '@/lib/health-score';
import { getCustomerPeerFeatures } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const message = String(body.message ?? '').trim();
  const customerId = body.customerId ?? 'demo-activation';

  if (!message) {
    return NextResponse.json(
      { error: 'message is required' },
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

    const result = runCoachChat(customerId, message, truth);
    return NextResponse.json({
      ...result,
      healthSource: healthResult?.source,
    });
  } catch (err) {
    console.error('[coach/chat]', err);
    return NextResponse.json(
      { error: 'Failed to get Coach reply' },
      { status: 500 }
    );
  }
}
