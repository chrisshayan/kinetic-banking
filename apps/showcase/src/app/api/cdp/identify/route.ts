import { NextRequest, NextResponse } from 'next/server';

const DATA_PLANE_URL = process.env.RUDDERSTACK_DATA_PLANE_URL ?? 'http://localhost:8080';
const WRITE_KEY = process.env.RUDDERSTACK_WRITE_KEY ?? '';

export async function POST(request: NextRequest) {
  if (!WRITE_KEY) {
    return NextResponse.json(
      { error: 'RUDDERSTACK_WRITE_KEY not configured' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { userId, traits = {} } = body;

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  const url = `${DATA_PLANE_URL.replace(/\/$/, '')}/v1/identify`;
  const auth = Buffer.from(`${WRITE_KEY}:`).toString('base64');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        userId,
        traits: { ...traits, updatedAt: new Date().toISOString() },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: 'RudderStack rejected', detail: text },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true, userId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send to RudderStack' },
      { status: 503 }
    );
  }
}
