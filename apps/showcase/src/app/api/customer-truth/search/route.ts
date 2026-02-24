import { NextRequest, NextResponse } from 'next/server';
import { searchCustomers } from '@/lib/opensearch';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 10), 50);

  if (!q.trim()) {
    return NextResponse.json({ customers: [] });
  }

  try {
    const customers = await searchCustomers(q, limit);
    return NextResponse.json({ customers });
  } catch (err) {
    console.error('[customer-truth search]', err);
    return NextResponse.json({ customers: [] });
  }
}
