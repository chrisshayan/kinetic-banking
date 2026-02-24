import { NextRequest, NextResponse } from 'next/server';
import { getDecisionHistory } from '@/lib/db';

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get('customerId') ?? '';
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 20), 50);

  if (!customerId) {
    return NextResponse.json(
      { error: 'customerId is required' },
      { status: 400 }
    );
  }

  try {
    const history = await getDecisionHistory(customerId, limit);
    return NextResponse.json({
      customerId,
      decisions: history.map((d) => ({
        id: d.id,
        domain: d.domain,
        action: d.action,
        outcome: d.outcome,
        timestamp: d.created_at,
      })),
    });
  } catch (err) {
    console.error('[decision-history]', err);
    return NextResponse.json(
      { error: 'Failed to fetch decision history' },
      { status: 500 }
    );
  }
}
