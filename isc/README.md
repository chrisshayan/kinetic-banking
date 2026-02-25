# Intelligence Supply Chain (Phase 5)

Data flow: **BaaS → Kafka → dbt → Feast → Neo4j → MLflow → LangGraph → OPA**

## Components

| Component | Path | Purpose |
|-----------|------|---------|
| **dbt** | `dbt/` | Semantic layer: stg_customers, stg_accounts, stg_transactions, fct_customer_health |
| **Feast** | `feast/` | Feature definitions + get_customer_health_features() |
| **Neo4j** | `ontology/` | Knowledge graph: Actions, Entities, Concepts |
| **MLflow** | `mlflow/` | Health score model (train_health_model.py) |
| **OPA** | `opa/` | Guardrail policies (guardrails.rego) |

## Setup

### 1. Start infrastructure

```bash
docker compose up -d
```

### 2. dbt (semantic layer)

Use **dbt-core** with the Postgres adapter (not the dbt Cloud CLI):

```bash
python -m venv .venv-isc
source .venv-isc/bin/activate   # or .venv-isc\Scripts\activate on Windows
pip install -r isc/requirements.txt
cd isc/dbt && dbt run
```

**If you see `dbt_cloud.yml credentials file not found`:** You likely have the dbt Cloud CLI installed instead of dbt-core. Use a fresh virtual environment and install only `dbt-postgres`. Do not install `dbt` or `dbt-cloud`.

**Note:** Peer benchmarking and health features work without dbt — the app falls back to raw SQL when `fct_customer_health` / `fct_customer_peers` views are missing.

### 3. Neo4j ontology

```bash
docker exec -i $(docker ps -qf "name=neo4j") cypher-shell -u neo4j -p kinetic123 < isc/ontology/seed.cypher
```

**Graph structure:** `(life_stage)-[:TRIGGERS]->(Action)-[:IN_DOMAIN]->(domain)`. CLO uses both: life_stage triggers which actions apply; domain filters to the routed domain. Re-run seed after ontology changes.

### 4. MLflow (health model)

```bash
pip install mlflow scikit-learn
MLFLOW_TRACKING_URI=http://localhost:5001 python isc/mlflow/train_health_model.py
```

### 5. OPA (guardrails)

OPA starts with `docker compose up`. Policies in `opa/policies/`.

## APIs

- **MLflow:** http://localhost:5001
- **Neo4j Browser:** http://localhost:7474 (neo4j / kinetic123)
- **OPA:** http://localhost:8181/v1/data/guardrails/allow
