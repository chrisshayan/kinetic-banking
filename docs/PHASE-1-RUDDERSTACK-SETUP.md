# Phase 1: RudderStack + Kafka Setup

Complete Phase 1 by configuring RudderStack and Kafka as a destination.

---

## 1. Prerequisites

- Docker Compose running (`docker compose up -d`)
- RudderStack Open Source account (free)

---

## 2. Get RudderStack Workspace Token

1. Sign up at **[RudderStack Open Source](https://app.rudderstack.com/signup?type=opensource)**
2. Create a workspace (or use default)
3. Go to **Settings → Workspace**
4. Copy your **Workspace Token**

---

## 3. Configure Environment

Create `.env` in the project root (or copy from `.env.example`):

```bash
RUDDERSTACK_WORKSPACE_TOKEN=your_token_here
```

RudderStack uses a **profile** so it only starts when requested. Start the full stack including CDP:

```bash
docker compose --profile cdp up -d
```

Without the profile, RudderStack services are not started (avoids "empty workspace config token" errors).

---

## 4. Add Kafka as Destination in RudderStack

1. In RudderStack dashboard, go to **Connections → Destinations**
2. Click **Add Destination**
3. Search for **Apache Kafka** and select it
4. Configure:
   - **Name:** `kinetic-kafka`
   - **Bootstrap Servers:** 
     - From host: `localhost:9092`
     - From Docker (if RudderStack needs to reach Kafka): use `host.docker.internal:9092` (Mac/Windows) or the Kafka service name if both are in same compose: `kafka:9092`
   - **Topic Name:** `customer.events` (or leave default)
   - **SSL:** Disabled (for local dev)
5. Connect a **Source** to this destination (see step 5)

---

## 5. Create Source and Connect to Kafka

1. Go to **Connections → Sources**
2. Add source: **HTTP API** (for server-side events from Mifos mock)
3. Connect the source to the Kafka destination
4. Copy the **Write Key** — add to `.env`:
   ```bash
   RUDDERSTACK_WRITE_KEY=your_write_key_here
   ```
5. Restart Mifos mock so it sends events to RudderStack

---

## 6. Event Flow (Phase 1)

```
Mifos Mock / Showcase
    │
    │  HTTP POST (identify, track)
    ▼
RudderStack Data Plane (localhost:8080)
    │
    │  Kafka destination
    ▼
Kafka topic: customer.events
```

---

## 7. Sending Events to RudderStack

### From Mifos Mock (server-side)

```ts
// POST https://localhost:8080/v1/track
{
  "userId": "client-123",
  "event": "transaction_completed",
  "properties": { "amount": 100, "type": "CREDIT" }
}
```

### From Showcase (browser)

Use RudderStack JavaScript SDK — load with your Data Plane URL and Write Key.

---

## 8. Verify

1. **RudderStack health:** `curl http://localhost:8080/health`
2. **Send test event** from Mifos mock or via curl
3. **Check Kafka:** `docker compose exec kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic customer.events --from-beginning`

---

## 9. Ports Summary

| Service        | Port | Purpose                    |
|----------------|------|----------------------------|
| RudderStack    | 8080 | Data plane (receive events)|
| Rudder DB      | 6432 | RudderStack jobs DB       |
| Rudder Transformer | 9090 | Transformations       |
| Kafka          | 9092 | Event backbone             |
