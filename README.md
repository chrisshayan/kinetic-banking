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

### 3. Seed Mifos mock & run services

```bash
pnpm --filter mifos-mock seed
pnpm mifos-mock &
pnpm showcase
```

### 4. Open showcase

- **Showcase:** http://localhost:3000
- **Mifos mock:** http://localhost:3001

**APIs (via showcase at port 3000):**

- **Customer Truth:** http://localhost:3000/api/customer-truth/health | http://localhost:3000/api/customer-truth/demo-customer
- **CLO:** http://localhost:3000/api/clo/health | POST http://localhost:3000/api/clo/nba
- **Coach:** http://localhost:3000/api/coach/health | POST http://localhost:3000/api/coach/chat | POST http://localhost:3000/api/coach/nudge

## Environment

Copy `.env.example` to `.env` and configure:

- `KAFKA_BOOTSTRAP_SERVERS`
- `DATABASE_URL`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (for Coach/CLO)

## Docs

- [Kinetic Showcase Plan](specs/KINETIC-SHOWCASE-PLAN.md)
- [Banking OS Architecture](specs/kinetic-banking-os-full.html)
