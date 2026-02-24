import { NextResponse } from 'next/server';
import { getEventStream } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

  try {
    const events = await getEventStream(limit);
    return NextResponse.json({
      events: events.map((e) => ({
        id: e.id,
        eventType: e.event_type,
        source: e.source,
        payload: e.payload,
        timestamp: e.created_at,
      })),
    });
  } catch (err) {
    console.error('[events]', err);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
