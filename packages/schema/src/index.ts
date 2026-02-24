/**
 * @kinetic/schema — Shared types and API contracts
 */

export interface Client {
  id: string;
  display_name: string;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED';
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  client_id: string;
  product_type: string;
  status: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  balance_after: number | null;
  description: string | null;
  created_at: string;
}

export interface CustomerTruth {
  id: string;
  displayName: string;
  lifeStage: string;
  behavioralSnapshot: object;
  decisionHistory: DecisionRecord[];
}

export interface DecisionRecord {
  id: string;
  customerId: string;
  domain: string;
  action: string;
  outcome?: string;
  timestamp: string;
}
