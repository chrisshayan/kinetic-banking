'use client';

import { useState } from 'react';

export function FeedbackSection() {
  const [customerId, setCustomerId] = useState('sarah-chen');
  const [decisions, setDecisions] = useState<Array<{ domain: string; action: string; outcome?: string; timestamp: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchHistory() {
    if (!customerId.trim()) return;
    setLoading(true);
    setError(null);
    setDecisions([]);
    try {
      const res = await fetch(`/api/coach/decision-history?customerId=${encodeURIComponent(customerId)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed');
        return;
      }
      setDecisions(data.decisions ?? []);
    } catch {
      setError('Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
      <h3 className="font-semibold text-emerald-400 mb-3">Outcome Feedback Loop</h3>
      <p className="text-slate-400 text-xs mb-3">
        CLO → Kafka (decisions.outcomes) → Writeback → Decision History → MLflow. Same data as{' '}
        <a href={`/api/customer-truth/${customerId}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
          /api/customer-truth/{customerId || '…'}
        </a>
      </p>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm w-48"
        />
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? '...' : 'View History'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
      {decisions.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {decisions.map((d, i) => (
            <div
              key={i}
              className="flex gap-3 text-sm py-2 border-b border-slate-700 last:border-0"
            >
              <span className="text-emerald-400 font-mono w-24 shrink-0">{d.domain}</span>
              <span className="text-slate-300">{d.action}</span>
              <span className="text-slate-500 text-xs shrink-0">{d.outcome ?? '—'}</span>
              <span className="text-slate-500 text-xs ml-auto">{new Date(d.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      {decisions.length === 0 && !loading && !error && (
        <p className="text-slate-500 text-sm">No decisions yet. Get an NBA from CLO first.</p>
      )}
    </div>
  );
}
