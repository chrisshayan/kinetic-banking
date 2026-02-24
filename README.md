# Kinetic Banking OS Showcase

Banking OS Full Vision — Shared Customer Truth, CLO, Financial Coach, Intelligence Supply Chain, Outcome Feedback Loop.

## Project Structure

```
kinetic-banking/
├── apps/
│   ├── mifos-mock/          # Mifos-like core banking REST API + Kafka events
│   └── showcase/            # Next.js UI + LangChain chat
├── services/
│   ├── customer-truth/      # Shared Source of Customer Truth API
│   ├── clo/                 # CLO Decision Domains (LangGraph)
│   ├── coach/               # Financial Coach (LangGraph)
│   ├── nudge/               # Financial Coach Nudge service
│   └── writeback/            # Outcome Feedback Loop consumer
├── packages/
│   ├── events/              # Kafka topics & event schemas
│   └── schema/              # Shared types & API contracts
├── isc/                     # Intelligence Supply Chain
│   ├── dbt/                 # Data transformation, semantic layer
│   ├── feast/               # Feature store
│   ├── ontology/            # Neo4j ontology
│   └── opa/                 # OPA guardrail policies
├── infra/
│   └── docker/              # Docker configs
├── specs/                   # Architecture & plan docs
├── docker-compose.yml       # Kafka, PostgreSQL, OpenSearch, Neo4j, MLflow
└── pnpm-workspace.yaml
```

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

**RudderStack CDP (optional):** Add `RUDDERSTACK_WORKSPACE_TOKEN` to `.env`, then:
```bash
docker compose --profile cdp up -d
```
See [docs/PHASE-1-RUDDERSTACK-SETUP.md](docs/PHASE-1-RUDDERSTACK-SETUP.md).

### 3. Phase 2 — Database & Kafka consumer

```bash
pnpm db:migrate
pnpm --filter mifos-mock seed
pnpm mifos-mock &
pnpm kafka-consumer &
pnpm showcase
```

See [docs/PHASE-2-SETUP.md](docs/PHASE-2-SETUP.md) for details.

### 4. Open showcase

- **Showcase:** http://localhost:3000
- **Mifos mock:** http://localhost:3001

**APIs (via showcase at port 3000):**

- **Customer Truth:** http://localhost:3000/api/customer-truth/health | http://localhost:3000/api/customer-truth/demo-customer
- **CLO:** http://localhost:3000/api/clo/health | POST http://localhost:3000/api/clo/nba
- **Coach:** http://localhost:3000/api/coach/health | POST http://localhost:3000/api/coach/chat | POST http://localhost:3000/api/coach/nudge

### 5. Phase 5 — Intelligence Supply Chain

```bash
docker compose up -d   # includes OPA, Neo4j, MLflow
pnpm isc:seed-ontology # load Neo4j ontology
```

See [isc/README.md](isc/README.md) for dbt, Feast, MLflow setup. CLO decisions are guarded by OPA (block if account closed or confidence < 0.7).

### 6. Phase 6 — Outcome Feedback Loop

```bash
pnpm writeback   # Consumes decisions.outcomes → Decision History
```

CLO NBA publishes to Kafka; writeback persists to PostgreSQL and triggers MLflow feedback runs. CLO/Coach decisions are logged to MLflow experiment `kinetic-decisions` (http://localhost:5001).

### 7. Run Demo (End-to-end)

```bash
# Ensure: docker compose up -d, pnpm writeback, pnpm isc:seed-ontology
pnpm showcase
# Open http://localhost:3000/demo → Run Demo
```

Flow: Seed Sarah → NBA (Neo4j ontology) → Coach nudge → Feedback loop.

## Environment

Copy `.env.example` to `.env` and configure:

- `KAFKA_BOOTSTRAP_SERVERS`
- `DATABASE_URL`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (for Coach/CLO)

## Docs

- [Kinetic Showcase Plan](specs/KINETIC-SHOWCASE-PLAN.md)
- [Banking OS Architecture](specs/kinetic-banking-os-full.html)
