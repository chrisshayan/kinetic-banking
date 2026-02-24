/**
 * Financial Coach Nudge Service
 * Converts Coach domain outputs → Transactional, Pockets & Budgets, FDP, User Insights
 * Consumes Coach events, delivers via Kafka / in-app
 */

import express from 'express';

const PORT = process.env.PORT ?? 3005;
const app = express();
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'nudge' }));

app.listen(PORT, () => {
  console.log(`Nudge service at http://localhost:${PORT}`);
});
