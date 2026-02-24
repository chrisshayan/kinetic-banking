# Option B: AI-First Design — Component Integration

**Approach:** Implement CLO and Coach LangGraph agents first, using mock Customer Truth. Wire showcase APIs to agents.

---

## 1. High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              USER / SHOWCASE UI                                          │
│  • Chat page: user types message                                                         │
│  • Layer Explorer: user selects customer, triggers NBA                                  │
│  • API calls: POST /api/coach/chat, POST /api/clo/nba                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         SHOWCASE API ROUTES (Next.js)                                     │
│  /api/coach/chat  ──► CoachAgent.invoke()                                                 │
│  /api/clo/nba     ──► CLOAgent.invoke()                                                   │
│  /api/customer-truth/[id] ──► getCustomerTruth() [mock or real]                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│   CUSTOMER TRUTH      │   │   CLO AGENT           │   │   COACH AGENT         │
│   (Mock → Real)       │   │   (LangGraph)         │   │   (LangGraph)         │
│                       │   │                       │   │                       │
│   • getCustomer(id)   │◄──│   • Reads truth       │◄──│   • Reads truth       │
│   • lifeStage         │   │   • Routes by domain  │   │   • Routes by domain  │
│   • behavioralSnapshot│   │   • Returns NBA        │   │   • Returns reply     │
│   • decisionHistory   │   │   • (Optional) OPA    │   │   • (Optional) OPA    │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
         │                              │                            │
         │                              │                            │
         ▼                              ▼                            ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│   MIFOS MOCK          │   │   NBA / NUDGE          │   │   DECISION HISTORY     │
│   (Data Source)       │   │   (Output)             │   │   (Writeback)          │
│                       │   │                       │   │                       │
│   • /clients          │   │   • NBA event         │   │   • Store decision     │
│   • /accounts         │   │   • Nudge event        │   │   • Update truth        │
│   • /transactions     │   │   • Kafka (future)    │   │   • PostgreSQL (future)│
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
```

---

## 2. Component Responsibilities

### 2.1 Customer Truth (Shared Source)

**Role:** Single source of customer state for CLO and Coach.

**Mock version (Phase 1):**
- Returns hardcoded or in-memory customer data
- Shape: `{ id, displayName, lifeStage, behavioralSnapshot, decisionHistory }`
- Can optionally call Mifos mock `/clients/:id` and `/accounts` to enrich

**Real version (Phase 2+):**
- Aggregates from Kafka, RudderStack, PostgreSQL
- Life-stage derived from Mifos + behavioral signals
- Decision history from PostgreSQL

**Interface:**
```ts
getCustomerTruth(customerId: string): Promise<CustomerTruth>
```

---

### 2.2 CLO Agent (LangGraph)

**Role:** Customer Lifetime Orchestrator — produces Next-Best-Action per lifecycle domain.

**Domains:**
| Domain      | Trigger (life-stage / signal)     | Example NBA                    |
|-------------|-----------------------------------|--------------------------------|
| Acquisition | New visitor, no account            | `sign_up`, `open_account`      |
| Activation  | New-to-bank, first 30 days        | `complete_onboarding`, `first_transaction` |
| Expansion   | Active, 2+ products               | `add_savings`, `apply_loan`    |
| Retention   | Churn risk, inactive 60+ days     | `win_back`, `contact_branch`   |

**Flow:**
```
[START] → fetch Customer Truth → route by lifeStage → LLM/rule selects NBA → [END]
```

**Input:**
```ts
{ customerId: string }
```

**Output:**
```ts
{
  customerId: string;
  domain: 'ACQUISITION' | 'ACTIVATION' | 'EXPANSION' | 'RETENTION';
  action: string;
  confidence: number;
  reasoning?: string;
}
```

**LangGraph structure:**
```
nodes: [fetchTruth, routeDomain, selectNBA]
edges: fetchTruth → routeDomain → selectNBA → END
```

---

### 2.3 Coach Agent (LangGraph)

**Role:** Financial Coach — conversational + proactive nudges across 5 domains.

**Domains:**
| Domain              | Purpose                          | Example output                    |
|---------------------|----------------------------------|-----------------------------------|
| Health Assessment   | Financial health score           | "Your health score is 72/100"    |
| Anomaly Detection   | Unusual spend/income             | "Unusual $500 charge detected"    |
| Peer Benchmarking   | Compare to similar customers     | "You save 15% more than peers"    |
| Early Warnings      | Overdraft, low balance           | "Balance may go negative soon"    |
| Weekly Reflections  | Weekly summary                   | "You spent 12% less this week"   |

**Flow (Chat):**
```
[START] → fetch Customer Truth → route intent (from message) → LLM generates reply → [END]
```

**Flow (Nudge):**
```
[START] → fetch Customer Truth → select domain (health/anomaly/benchmark/warning/reflection) → LLM generates nudge → [END]
```

**Input (chat):**
```ts
{ customerId: string; message: string; history?: Message[] }
```

**Output (chat):**
```ts
{ reply: string; domain?: string; suggestedActions?: string[] }
```

**Input (nudge):**
```ts
{ customerId: string; domain?: 'health' | 'anomaly' | 'benchmark' | 'warning' | 'reflection' }
```

**Output (nudge):**
```ts
{ customerId: string; type: string; message: string; domain: string }
```

**LangGraph structure (chat):**
```
nodes: [fetchTruth, routeIntent, generateReply]
edges: fetchTruth → routeIntent → generateReply → END
```

---

## 3. Call Sequences

### 3.1 User asks Coach a question (Chat)

```
1. User types "How is my financial health?" in Chat UI
2. Chat UI → POST /api/coach/chat { customerId: "alice-123", message: "How is my financial health?" }
3. API route calls CoachAgent.invoke({ customerId, message })
4. CoachAgent:
   a. Calls getCustomerTruth("alice-123") → receives { lifeStage, behavioralSnapshot, ... }
   b. Routes to "health_assessment" (from message intent)
   c. LLM generates reply using truth + domain context
   d. Returns { reply: "Your financial health score is 72/100. You're doing well on savings..." }
5. API returns { reply } to UI
6. UI displays Coach reply
```

### 3.2 User triggers CLO NBA (Layer Explorer)

```
1. User selects customer "alice-123" and clicks "Get Next-Best-Action"
2. UI → POST /api/clo/nba { customerId: "alice-123" }
3. API route calls CLOAgent.invoke({ customerId })
4. CLOAgent:
   a. Calls getCustomerTruth("alice-123") → receives { lifeStage: "NEW_TO_BANK", ... }
   b. Routes to ACTIVATION domain (lifeStage = NEW_TO_BANK)
   c. LLM/rule selects NBA: "complete_onboarding"
   d. Returns { domain: "ACTIVATION", action: "complete_onboarding", confidence: 0.85 }
5. API returns NBA to UI
6. UI displays "Recommended: Complete onboarding"
```

### 3.3 Coach generates proactive nudge

```
1. (Cron or event) → POST /api/coach/nudge { customerId: "alice-123", domain: "weekly_reflection" }
2. API route calls CoachAgent.generateNudge({ customerId, domain })
3. CoachAgent:
   a. Calls getCustomerTruth("alice-123")
   b. Uses domain "weekly_reflection"
   c. LLM generates nudge from transaction summary
   d. Returns { type: "weekly_reflection", message: "Your spending was 12% below average..." }
4. (Future) Nudge published to Kafka / in-app notification
```

---

## 4. Data Flow Diagram (Option B)

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    SHOWCASE (Next.js)                    │
                    │                                                          │
                    │  /api/coach/chat     /api/clo/nba     /api/coach/nudge   │
                    │        │                  │                  │           │
                    └────────┼──────────────────┼──────────────────┼──────────┘
                             │                  │                  │
                             ▼                  ▼                  ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │              AGENT LAYER (lib/agents/)                    │
                    │                                                          │
                    │  CoachAgent.invoke()    CLOAgent.invoke()   CoachAgent   │
                    │        │                       │            .generateNudge()
                    └────────┼───────────────────────┼────────────────────────┘
                             │                       │
                             │    ┌──────────────────┘
                             │    │
                             ▼    ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │           CUSTOMER TRUTH (lib/customer-truth.ts)         │
                    │                                                          │
                    │  getCustomerTruth(id) → { lifeStage, behavioralSnapshot, │
                    │                           decisionHistory, accounts... }  │
                    │                                                          │
                    │  Mock: in-memory / hardcoded                              │
                    │  Real: fetch from Mifos + Kafka + PostgreSQL              │
                    └─────────────────────────────────────────────────────────┘
                             │
                             │ (optional: fetch from Mifos)
                             ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                    MIFOS MOCK                            │
                    │  GET /clients/:id    GET /accounts?client_id=:id           │
                    │  GET /transactions?account_id=:id                        │
                    └─────────────────────────────────────────────────────────┘
```

---

## 5. File Structure (Option B Implementation)

```
apps/showcase/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── coach/
│   │   │   │   ├── chat/route.ts     → CoachAgent.invoke()
│   │   │   │   └── nudge/route.ts    → CoachAgent.generateNudge()
│   │   │   ├── clo/
│   │   │   │   └── nba/route.ts      → CLOAgent.invoke()
│   │   │   └── customer-truth/[id]/route.ts  → getCustomerTruth()
│   │   ├── chat/page.tsx             → Chat UI, calls /api/coach/chat
│   │   └── layers/page.tsx           → Layer Explorer, calls /api/clo/nba
│   │
│   └── lib/
│       ├── agents/
│       │   ├── clo-agent.ts          # LangGraph CLO
│       │   └── coach-agent.ts        # LangGraph Coach
│       ├── customer-truth.ts         # getCustomerTruth (mock → real)
│       └── mifos-client.ts           # Fetch from Mifos mock API
```

---

## 6. Customer Truth Schema (Mock)

```ts
interface CustomerTruth {
  id: string;
  displayName: string;
  lifeStage: 'NEW_TO_BANK' | 'ACTIVE' | 'CHURN_RISK' | 'PENDING';
  behavioralSnapshot: {
    lastLogin?: string;
    transactionCount30d?: number;
    failedLogins?: number;
    productsHeld?: number;
  };
  accounts?: { id: string; productType: string; balance: number }[];
  decisionHistory: { domain: string; action: string; outcome?: string; timestamp: string }[];
}
```

**Mock implementation:** Return 2–3 hardcoded customers with different life-stages for demo.

---

## 7. CLO Agent — LangGraph Nodes

| Node         | Input                    | Output                         |
|--------------|--------------------------|--------------------------------|
| fetchTruth   | customerId               | customerTruth                  |
| routeDomain  | customerTruth            | domain (ACQUISITION|ACTIVATION|EXPANSION|RETENTION) |
| selectNBA    | domain, customerTruth    | { action, confidence, reasoning } |

**Routing logic (routeDomain):**
- `lifeStage === 'PENDING'` → ACQUISITION
- `lifeStage === 'NEW_TO_BANK'` or first 30 days → ACTIVATION
- `productsHeld >= 2` → EXPANSION
- `lifeStage === 'CHURN_RISK'` or inactive 60d → RETENTION

**selectNBA:** LLM prompt with domain + customer context → returns action + confidence.

---

## 8. Coach Agent — LangGraph Nodes

**Chat flow:**
| Node          | Input              | Output                    |
|---------------|--------------------|---------------------------|
| fetchTruth    | customerId         | customerTruth             |
| routeIntent   | message, truth     | domain (health|anomaly|benchmark|warning|reflection) |
| generateReply | domain, message, truth | reply                  |

**Nudge flow:**
| Node          | Input              | Output                    |
|---------------|--------------------|---------------------------|
| fetchTruth    | customerId         | customerTruth             |
| generateNudge | domain, truth      | { type, message }        |

**routeIntent:** LLM classifies message intent, or keyword match for demo.

---

## 9. LLM Integration

**Provider:** OpenAI or Anthropic (via LangChain) — or Ollama for local.

**Prompts:**
- CLO: "Given customer life-stage {X} and domain {Y}, suggest the single best next action. Return JSON: { action, confidence, reasoning }."
- Coach (chat): "You are a financial coach. Customer context: {truth}. User asked: {message}. Reply helpfully and concisely."
- Coach (nudge): "Generate a {domain} nudge for this customer: {truth}. Be empathetic and actionable."

---

## 10. Execution Order (Option B)

| Step | Task                                      | Deliverable                          |
|------|-------------------------------------------|--------------------------------------|
| 1    | Customer Truth mock                       | `lib/customer-truth.ts` with 2–3 demo customers |
| 2    | Mifos client (optional)                   | `lib/mifos-client.ts` to enrich truth from Mifos |
| 3    | CLO LangGraph agent                      | `lib/agents/clo-agent.ts`            |
| 4    | Wire `/api/clo/nba` to CLO agent          | API returns real NBA                 |
| 5    | Coach LangGraph agent                     | `lib/agents/coach-agent.ts`           |
| 6    | Wire `/api/coach/chat` to Coach agent     | API returns real reply               |
| 7    | Wire `/api/coach/nudge` to Coach agent    | API returns real nudge               |
| 8    | Update Chat UI for streaming (optional)  | Better UX                            |
| 9    | Update Layer Explorer with NBA display    | User can trigger and see NBA         |

---

## 11. Dependencies to Add (Showcase)

```json
{
  "@langchain/langgraph": "^0.2.x",
  "@langchain/core": "^0.3.x",
  "@langchain/openai": "^0.3.x"
}
```

Optional: `@langchain/anthropic` for Claude.

---

*Option B: AI-First Design — Ready for implementation*
