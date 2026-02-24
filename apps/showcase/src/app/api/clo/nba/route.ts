import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const customerId = body.customerId ?? 'demo-customer';
  return NextResponse.json({
    customerId,
    domain: 'ACTIVATION',
    action: 'complete_onboarding',
    confidence: 0.85,
  });
}
