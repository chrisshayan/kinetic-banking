'use client';

import { useState } from 'react';

export function TruthSection() {
  const [customerId, setCustomerId] = useState('demo-activation');
  const [data, setData] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <pre className="text-xs bg-slate-900 rounded p-3 overflow-x-auto max-h-48 overflow-y-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
