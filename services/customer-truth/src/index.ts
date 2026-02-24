/**
 * Shared Source of Customer Truth API
 * Unified profile, behavioral signals, decision history
 * Consumes: Kafka (mifos.*, customer.events), RudderStack
 * Serves: CLO, Financial Coach, Showcase UI
 */

import express from 'express';

const PORT = process.env.PORT ?? 3002;
const app = express();
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'customer-truth' }));

app.get('/customers/:id', (req, res) => {
  // TODO: Aggregate from RudderStack + Mifos + OpenSearch
  res.json({
    id: req.params.id,
    displayName: 'Demo Customer',
    lifeStage: 'ACTIVE',
    behavioralSnapshot: {},
    decisionHistory: [],
  });
});

app.listen(PORT, () => {
  console.log(`Customer Truth API at http://localhost:${PORT}`);
});
