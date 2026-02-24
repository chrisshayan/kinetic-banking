/**
 * RudderStack CDP — Send events to data plane
 * Events flow: Mifos Mock → RudderStack → Kafka (when Kafka destination configured)
 */

const DATA_PLANE_URL = process.env.RUDDERSTACK_DATA_PLANE_URL ?? 'http://localhost:8080';
const WRITE_KEY = process.env.RUDDERSTACK_WRITE_KEY ?? '';

export async function sendToRudderStack(
  event: string,
  userId: string,
  properties: Record<string, unknown> = {}
) {
  if (!WRITE_KEY) return; // Skip if not configured

  const url = `${DATA_PLANE_URL.replace(/\/$/, '')}/v1/track`;
  const auth = Buffer.from(`${WRITE_KEY}:`).toString('base64');

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        userId,
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch (err) {
    console.warn('[RudderStack] Failed to send event:', err);
  }
}

export async function identifyToRudderStack(
  userId: string,
  traits: Record<string, unknown> = {}
) {
  if (!WRITE_KEY) return;

  const url = `${DATA_PLANE_URL.replace(/\/$/, '')}/v1/identify`;
  const auth = Buffer.from(`${WRITE_KEY}:`).toString('base64');

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        userId,
        traits: {
          ...traits,
          updatedAt: new Date().toISOString(),
        },
      }),
    });
  } catch (err) {
    console.warn('[RudderStack] Failed to identify:', err);
  }
}
