'use client';

import { useState } from 'react';

interface Decision {
  id: string;
  domain: string;
  action: string;
  outcome?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface CustomerTruth {
  id: string;
  displayName: string;
  lifeStage: string;
  accounts: Array<{ id: string; productType: string; balance: number; accountNumber?: string }>;
  recentTransactions: Array<{ description: string; amount: number; timestamp: string }>;
  journey: Decision[];
  decisionHistory: Decision[];
}

export function TruthSection() {
  const [customerId, setCustomerId] = useState('sarah-chen');
  const [data, setData] = useState<CustomerTruth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  async function fetchTruth() {
    if (!customerId.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/customer-truth/${customerId}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Not found');
        return;
      }
      setData(json);
    } catch {
      setError('Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
      <h3 className="font-semibold text-cyan-400 mb-3">View Customer Truth</h3>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm w-48"
        />
        <button
          onClick={fetchTruth}
          disabled={loading}
          className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? '...' : 'Fetch'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">{data.displayName} · {data.lifeStage}</span>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-xs text-cyan-400 hover:underline"
            >
              {showRaw ? 'Hide raw' : 'Show raw JSON'}
            </button>
          </div>
          {!showRaw && (
            <>
              <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="text-emerald-400 text-xs font-medium mb-2">Outcome Feedback Loop</p>
                <p className="text-slate-400 text-xs font-mono mb-3">
                  CLO → Kafka (decisions.outcomes) → Writeback → Decision History → MLflow
                </p>
                <p className="text-slate-500 text-xs">
                  Decision history below flows through this pipeline (same source as /api/customer-truth/{data.id})
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium mb-2">Decision History (from pipeline)</p>
                <div className="space-y-1 max-h-40 overflow-y-auto rounded bg-slate-900/50 p-2">
                  {data.decisionHistory?.length > 0 ? (
                    data.decisionHistory.map((d) => (
                      <div key={d.id} className="flex gap-3 text-sm py-1.5 border-b border-slate-700/50 last:border-0">
                        <span className="text-emerald-400 font-mono w-24 shrink-0">{d.domain}</span>
                        <span className="text-slate-300">{d.action}</span>
                        <span className="text-slate-500 text-xs shrink-0">{d.outcome ?? '—'}</span>
                        <span className="text-slate-500 text-xs ml-auto">{new Date(d.timestamp).toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-xs">No decisions yet. Get an NBA from CLO first.</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500 mb-1">Accounts</p>
                  {data.accounts?.map((a) => (
                    <div key={a.id} className="text-slate-300">
                      {a.productType} {a.accountNumber ?? a.id} · ${Number(a.balance).toLocaleString()}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Recent transactions</p>
                  {data.recentTransactions?.slice(0, 3).map((t) => (
                    <div key={t.description + t.timestamp} className="text-slate-300">
                      {t.description} {t.amount > 0 ? '+' : ''}{t.amount}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {showRaw && (
            <pre className="text-xs bg-slate-900 rounded p-3 overflow-x-auto max-h-48 overflow-y-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
