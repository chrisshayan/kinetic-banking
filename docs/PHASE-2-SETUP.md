# Phase 2: Shared Source of Customer Truth — Setup

## 1. Run PostgreSQL migration

```bash
# Ensure Docker Postgres is running
docker compose up -d postgres

# Run migration
pnpm db:migrate
```

Uses Node + `pg` (no `psql` required). Ensure Postgres is running (`docker compose up -d postgres`).

## 2. Seed Mifos mock (if not done)

```bash
pnpm mifos-mock seed
```

## 3. Start services (in order)

**Terminal 1 — Mifos mock** (emits to Kafka):
```bash
pnpm mifos-mock
```

**Terminal 2 — Kafka consumer** (Kafka → PostgreSQL + OpenSearch):
```bash
pnpm kafka-consumer
```

**Terminal 3 — Showcase**:
```bash
pnpm showcase
```

## 4. Populate data

Create a client via Mifos mock to trigger the pipeline:

```bash
curl -X POST http://localhost:3001/clients -H "Content-Type: application/json" -d '{"display_name":"Alice Test","status":"ACTIVE"}'
```

The Kafka consumer will upsert to PostgreSQL and OpenSearch. Then:

- `GET /api/customer-truth/<client-id>` — returns unified customer (from PostgreSQL)
- `GET /api/customer-truth/search?q=alice` — search via OpenSearch

## 5. Environment

Ensure `.env` has:
```
DATABASE_URL=postgresql://kinetic:kinetic@localhost:5432/kinetic
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
OPENSEARCH_URL=http://localhost:9200
```

For showcase, add to `apps/showcase/.env.local`:
```
DATABASE_URL=postgresql://kinetic:kinetic@localhost:5432/kinetic
OPENSEARCH_URL=http://localhost:9200
```
