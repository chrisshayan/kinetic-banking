/**
 * Sync customers to OpenSearch for entity resolution
 * Called after upserting to PostgreSQL
 */

const OPENSEARCH_URL = process.env.OPENSEARCH_URL ?? 'http://localhost:9200';

export async function ensureCustomersIndex() {
  const res = await fetch(`${OPENSEARCH_URL}/customers`).catch(() => null);
  if (res?.ok) return;
  await fetch(`${OPENSEARCH_URL}/customers`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mappings: {
        properties: {
          id: { type: 'keyword' },
          display_name: { type: 'text' },
          status: { type: 'keyword' },
          life_stage: { type: 'keyword' },
          updated_at: { type: 'date' },
        },
      },
    }),
  }).catch((err) => console.warn('[opensearch] create index failed:', err));
}

export async function indexCustomer(payload: Record<string, unknown>) {
  const id = String(payload.id ?? '');
  if (!id) return;
  try {
    await fetch(`${OPENSEARCH_URL}/customers/_doc/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        display_name: payload.display_name ?? '',
        status: payload.status ?? 'PENDING',
        life_stage: payload.life_stage ?? payload.status ?? 'NEW_TO_BANK',
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn('[opensearch] index customer failed:', err);
  }
}
