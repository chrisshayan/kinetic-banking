# Phase 3: CLO Decision Domains — Detailed Design

**Goal:** Implement the Customer Lifetime Orchestrator (CLO) that produces Next-Best-Actions per lifecycle domain, using real Customer Truth from Phase 2.

---

## 1. CLO Overview

**Role:** Orchestrates customer journeys by consuming Customer Truth and triggering Next-Best-Actions (NBAs) across each lifecycle domain.

**Domains (from spec):**

| Domain | Icon | Trigger | Purpose |
|--------|------|---------|---------|
| **Acquisition** | 🎯 | New visitor, no account, PENDING | Convert to first account |
| **Activation** | ⚡ | New-to-Bank, first 30 days | Drive first transaction, complete onboarding |
| **Expansion** | 📈 | Active, 2+ products | Cross-sell, add savings/loan |
| **Retention** | 🔒 | Churn risk, inactive 60+ days | Win-back, engagement |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  POST /api/clo/nba { customerId }                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  CLO Agent (LangGraph)                                                    │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                │
│  │ fetchTruth   │───►│ routeDomain  │───►│ selectNBA    │───► output    │
│  └──────────────┘    └──────────────┘    └──────────────┘                │
│         │                    │                    │                       │
│         ▼                    ▼                    ▼                       │
│  GET /api/...         lifeStage logic       LLM or rules                 │
│  customer-truth       + account count       + domain config               │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Optional: persist to decision_history, publish to Kafka                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow

### 3.1 Input

```ts
interface CLOInput {
  customerId: string;
}
```

### 3.2 Customer Truth (from Phase 2)

```ts
interface CustomerTruth {
  id: string;
  displayName: string;
  lifeStage: string;      // PENDING | NEW_TO_BANK | ACTIVE | CHURN_RISK
  accounts: Array<{
    id: string;
    productType: string;
    status: string;
    balance: number;
    currency: string;
  }>;
  decisionHistory: Array<{
    id: string;
    domain: string;
    action: string;
    outcome?: string;
    timestamp: string;
  }>;
}
```

### 3.3 Output

```ts
interface NBAOutput {
  customerId: string;
  domain: 'ACQUISITION' | 'ACTIVATION' | 'EXPANSION' | 'RETENTION';
  action: string;
  confidence: number;
  reasoning?: string;
}
```

---

## 4. Domain Routing Logic

| Condition | Domain | Notes |
|-----------|--------|-------|
| `lifeStage === 'PENDING'` or no accounts | **ACQUISITION** | Not yet a customer |
| `lifeStage === 'NEW_TO_BANK'` or first account &lt; 30 days | **ACTIVATION** | Onboard, first transaction |
| `accounts.length >= 2` and status ACTIVE | **EXPANSION** | Cross-sell |
| `lifeStage === 'CHURN_RISK'` or inactive 60+ days | **RETENTION** | Win-back |

**Derived signals (if not in Customer Truth):**
- `accountCount` = `accounts.length`
- `daysSinceFirstAccount` = from `created_at` of first account
- `hasRecentTransaction` = from transactions (future: behavioral_signals)

---

## 5. NBA per Domain

### 5.1 Acquisition Domain

| Action | Description | Confidence |
|--------|-------------|------------|
| `sign_up` | Complete registration | 0.9 |
| `open_account` | Open first account | 0.8 |
| `verify_identity` | Complete KYC | 0.85 |

### 5.2 Activation Domain

| Action | Description | Confidence |
|--------|-------------|------------|
| `complete_onboarding` | Finish onboarding | 0.9 |
| `first_transaction` | Make first transaction | 0.85 |
| `set_up_direct_deposit` | Link income source | 0.8 |
| `verify_email` | Verify email | 0.9 |

### 5.3 Expansion Domain

| Action | Description | Confidence |
|--------|-------------|------------|
| `add_savings` | Open savings account | 0.8 |
| `apply_loan` | Apply for loan | 0.7 |
| `add_card` | Add debit/credit card | 0.85 |
| `set_up_budget` | Use budgeting feature | 0.75 |

### 5.4 Retention Domain

| Action | Description | Confidence |
|--------|-------------|------------|
| `win_back` | Re-engagement campaign | 0.8 |
| `contact_branch` | Schedule call | 0.75 |
| `offer_incentive` | Special offer | 0.7 |
| `survey` | Feedback survey | 0.9 |

---

## 6. LangGraph Structure

### 6.1 State

```ts
interface CLOState {
  customerId: string;
  customerTruth: CustomerTruth | null;
  domain: CLODomain | null;
  nba: NBAOutput | null;
}
```

### 6.2 Nodes

| Node | Input | Output | Logic |
|------|-------|--------|-------|
| **fetchTruth** | customerId | customerTruth | GET /api/customer-truth/:id |
| **routeDomain** | customerTruth | domain | Apply routing rules |
| **selectNBA** | domain, customerTruth | nba | LLM or rule-based selection |

### 6.3 Edges

```
START → fetchTruth → routeDomain → selectNBA → END
```

### 6.4 Implementation Options

**Option A: Rule-based (no LLM)**
- `selectNBA` uses a config map: `domain → [actions]`
- Pick first action not in `decisionHistory` for this domain
- Fast, deterministic, no API cost

**Option B: LLM-based**
- `selectNBA` uses LLM prompt: "Given customer X, domain Y, suggest best NBA"
- Returns `{ action, confidence, reasoning }`
- More flexible, contextual

**Option C: Hybrid**
- Rule-based for routing
- LLM for `selectNBA` when available, else fallback to rules

---

## 7. File Structure

```
apps/showcase/src/
├── lib/
│   ├── agents/
│   │   └── clo-agent.ts      # LangGraph CLO
│   └── clo/
│       └── domain-rules.ts   # Domain → NBA mapping
├── app/
│   └── api/
│       └── clo/
│           └── nba/
│               └── route.ts  # → CLOAgent.invoke()
```

---

## 8. API Contract

### POST /api/clo/nba

**Request:**
```json
{
  "customerId": "uuid-here"
}
```

**Response (200):**
```json
{
  "customerId": "uuid-here",
  "domain": "ACTIVATION",
  "action": "complete_onboarding",
  "confidence": 0.85,
  "reasoning": "Customer is new to bank with 1 account. Recommend completing onboarding."
}
```

**Response (404):** Customer not found in Customer Truth

---

## 9. Optional: Decision History Writeback

After returning NBA, optionally persist for Outcome Feedback Loop:

```ts
await pool.query(
  `INSERT INTO decision_history (customer_id, domain, action, outcome, metadata)
   VALUES ($1, $2, $3, $4, $5)`,
  [customerId, domain, action, null, JSON.stringify({ confidence, reasoning })]
);
```

---

## 10. Optional: Kafka NBA Event

Publish for downstream consumers (Nudge service, etc.):

```ts
// Topic: clo.nba
{
  "customerId": "...",
  "domain": "ACTIVATION",
  "action": "complete_onboarding",
  "confidence": 0.85,
  "timestamp": "2025-02-24T..."
}
```

---

## 11. Build Order

| Step | Task | Deliverable |
|------|------|-------------|
| 1 | Domain routing rules | `lib/clo/domain-rules.ts` |
| 2 | NBA selection (rule-based) | `selectNBA` in clo-agent |
| 3 | CLO LangGraph agent | `lib/agents/clo-agent.ts` |
| 4 | Wire API route | `POST /api/clo/nba` → agent |
| 5 | (Optional) LLM integration | Replace rule-based selectNBA |
| 6 | (Optional) Decision History writeback | Persist after NBA |
| 7 | (Optional) Kafka publish | Publish NBA event |

---

## 12. Dependencies

```json
{
  "@langchain/langgraph": "^0.2.x",
  "@langchain/core": "^0.3.x",
  "@langchain/openai": "^0.3.x"  // if using LLM
}
```

---

*Phase 3: CLO Decision Domains — Ready for implementation*
