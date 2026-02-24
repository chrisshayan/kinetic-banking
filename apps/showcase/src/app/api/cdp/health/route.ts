import { NextResponse } from 'next/server';

const DATA_PLANE_URL = process.env.RUDDERSTACK_DATA_PLANE_URL ?? 'http://localhost:8080';

export async function GET() {
  try {
    const res = await fetch(`${DATA_PLANE_URL.replace(/\/$/, '')}/health`, {
      cache: 'no-store',
    });
    const ok = res.ok;
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      status: ok ? 'ok' : 'degraded',
      service: 'cdp-rudderstack',
      rudderstack: ok ? data : { error: res.statusText },
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'unavailable',
        service: 'cdp-rudderstack',
        error: err instanceof Error ? err.message : 'RudderStack unreachable',
      },
      { status: 503 }
    );
  }
}
