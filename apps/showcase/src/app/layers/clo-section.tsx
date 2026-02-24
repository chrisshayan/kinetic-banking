'use client';

import { useState } from 'react';

export function CLOSection() {
  const [customerId, setCustomerId] = useState('');
  const [nba, setNba] = useState<{ domain: string; action: string; confidence: number; reasoning?: string; displayMessage?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getNBA() {
    if (!customerId.trim()) return;
    setLoading(true);
    setError(null);
    setNba(null);
    try {
      const res = await fetch('/api/clo/nba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customerId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed');
        return;
      }
      setNba(data);
    } catch {
      setError('Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
      <h3 className="font-semibold text-green-400 mb-3">CLO — Next-Best-Action</h3>
      <p className="text-slate-400 text-xs mb-3">
        Try: demo-acquisition, demo-activation, demo-expansion, demo-retention (run <code className="bg-slate-800 px-1 rounded">pnpm db:seed-demo</code> first)
      </p>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm w-64"
        />
        <button
          onClick={getNBA}
          disabled={loading}
          className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? '...' : 'Get NBA'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
      {nba && (
        <div className="text-sm space-y-2">
          {nba.displayMessage && (
            <p className="text-green-300 font-medium border-l-2 border-green-500 pl-3 py-1">
              {nba.displayMessage}
            </p>
          )}
          <div className="flex gap-4 text-slate-400">
            <span>Domain: <strong className="text-slate-200">{nba.domain}</strong></span>
            <span>Action: <strong className="text-slate-200">{nba.action}</strong></span>
            <span>Confidence: <strong className="text-slate-200">{(nba.confidence * 100).toFixed(0)}%</strong></span>
          </div>
          {nba.reasoning && <p className="text-slate-500 text-xs">{nba.reasoning}</p>}
        </div>
      )}
    </div>
  );
}
