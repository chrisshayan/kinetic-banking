import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const message = body.message ?? '';
  return NextResponse.json({
    reply: `Coach: I'd be happy to help with "${message}". (Placeholder — LangGraph integration pending)`,
  });
}
