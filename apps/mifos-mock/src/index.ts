/**
 * Mifos-like Core Banking Mock
 * REST API for clients, accounts, transactions + Kafka event emission
 */

import express from 'express';
import { createKafkaProducer } from './kafka.js';
import { setupRoutes } from './routes.js';
import { initDb } from './db.js';

const PORT = process.env.PORT ?? 3001;

async function main() {
  const app = express();
  app.use(express.json());

  initDb();
  const producer = await createKafkaProducer();

  setupRoutes(app, producer);

  app.listen(PORT, () => {
    console.log(`Mifos mock running at http://localhost:${PORT}`);
  });
}

main().catch(console.error);
