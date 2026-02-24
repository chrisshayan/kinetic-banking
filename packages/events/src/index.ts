/**
 * @kinetic/events — Kafka event schemas and topics
 */

export const TOPICS = {
  MIFOS_CLIENTS: 'mifos.clients',
  MIFOS_ACCOUNTS: 'mifos.accounts',
  MIFOS_TRANSACTIONS: 'mifos.transactions',
  CUSTOMER_EVENTS: 'customer.events',
  DECISIONS_OUTCOMES: 'decisions.outcomes',
  NUDGES: 'nudges',
} as const;

export type EventType =
  | 'client.created'
  | 'client.activated'
  | 'account.opened'
  | 'account.updated'
  | 'transaction.completed'
  | 'decision.outcome'
  | 'nudge.delivered';

export interface BaseEvent {
  type: EventType;
  payload: object;
  timestamp: string;
}
