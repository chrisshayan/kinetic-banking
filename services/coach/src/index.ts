/**
 * Financial Coach — 5 Decision Domains
 * Health Assessment, Anomaly Detection, Peer Benchmarking, Early Warnings, Weekly Reflections
 * Consumes Customer Truth, produces nudges
 */

import express from 'express';

const PORT = process.env.PORT ?? 3004;
const app = express();
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'coach' }));

app.post('/chat', async (req, res) => {
  // TODO: LangGraph agent — conversational interface to Coach
  const { message } = req.body;
  res.json({
    reply: `Coach: I'd be happy to help with "${message}". (Placeholder — LangGraph integration pending)`,
  });
});

app.post('/nudge', async (req, res) => {
  // TODO: Generate nudge from Coach domains
  const { customerId } = req.body;
  res.json({
    customerId,
    type: 'weekly_reflection',
    message: 'Your spending was 12% below average this week. Great job!',
  });
});

app.listen(PORT, () => {
  console.log(`Coach service at http://localhost:${PORT}`);
});
