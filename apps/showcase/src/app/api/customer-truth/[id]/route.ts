import { NextResponse } from 'next/server';
import {
  getCustomerById,
  getAccountsByCustomerId,
  getDecisionHistory,
  getRecentTransactionsForCustomer,
} from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const customer = await getCustomerById(id);
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found', id },
        { status: 404 }
      );
    }

    const [accounts, decisionHistory, recentTransactions] = await Promise.all([
      getAccountsByCustomerId(id),
      getDecisionHistory(id),
      getRecentTransactionsForCustomer(id),
    ]);

    // Build journey summary from decision history
    const journey = decisionHistory
      .slice()
      .reverse()
      .map((d) => ({
        domain: d.domain,
        action: d.action,
        outcome: d.outcome,
        metadata: d.metadata ?? undefined,
        timestamp: d.created_at,
      }));

    return NextResponse.json({
      id: customer.id,
      displayName: customer.display_name,
      lifeStage: customer.life_stage || customer.status,
      behavioralSnapshot: {},
      accounts: accounts.map((a) => ({
        id: a.id,
        productType: a.product_type,
        status: a.status,
        balance: Number(a.balance),
        currency: a.currency,
        accountNumber: a.account_number ?? undefined,
        openedAt: a.created_at,
      })),
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        accountId: t.account_id,
        type: t.type,
        amount: Number(t.amount),
        description: t.description,
        timestamp: t.created_at,
      })),
      journey,
      decisionHistory: decisionHistory.map((d) => ({
        id: d.id,
        domain: d.domain,
        action: d.action,
        outcome: d.outcome,
        metadata: d.metadata ?? undefined,
        timestamp: d.created_at,
      })),
    });
  } catch (err) {
    console.error('[customer-truth]', err);
    return NextResponse.json(
      { error: 'Failed to fetch customer truth' },
      { status: 500 }
    );
  }
}
