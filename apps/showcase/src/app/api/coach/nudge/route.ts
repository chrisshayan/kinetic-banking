import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const customerId = body.customerId ?? 'demo-customer';
  return NextResponse.json({
    customerId,
    type: 'weekly_reflection',
    message: 'Your spending was 12% below average this week. Great job!',
  });
}
