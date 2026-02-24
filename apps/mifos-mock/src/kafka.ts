/**
 * Kafka producer for event emission
 * Topics: mifos.clients, mifos.accounts, mifos.transactions
 */

import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'mifos-mock',
  brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS ?? 'localhost:9092').split(','),
});

export async function createKafkaProducer() {
  const producer = kafka.producer();
  await producer.connect();
  return producer;
}

export async function emitEvent(
  producer: Awaited<ReturnType<typeof createKafkaProducer>>,
  topic: string,
  eventType: string,
  payload: object
) {
  await producer.send({
    topic,
    messages: [
      {
        key: payload.id ?? payload.client_id ?? payload.account_id,
        value: JSON.stringify({ type: eventType, payload, timestamp: new Date().toISOString() }),
      },
    ],
  });
}
