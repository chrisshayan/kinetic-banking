'use client';

import { useState } from 'react';

const DOMAINS = [
  'health_assessment',
  'anomaly_detection',
  'peer_benchmarking',
  'early_warnings',
  'weekly_reflection',
] as const;

export function CoachSection() {
  const [customerId, setCustomerId] = useState('demo-activation');
  const [domain, setDomain] = useState<(typeof DOMAINS)[number]>('weekly_reflection');
  const [nudge, setNudge] = useState<{ type: string; message: string; domain: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getNudge() {
    setLoading(true);
    setError(null);
    setNudge(null);
    try {
      const res = await fetch('/api/coach/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, domain }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed');
        return;
      }
      setNudge(data);
    } catch {
      setError('Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
      <h3 className="font-semibold text-amber-400 mb-3">Coach — Generate Nudge</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="text"
          placeholder="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm w-40"
        />
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value as (typeof DOMAINS)[number])}
          className="px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm"
        >
          {DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button
          onClick={getNudge}
          disabled={loading}
          className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? '...' : 'Get Nudge'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
      {nudge && (
        <div className="text-sm">
          <p className="text-amber-300 font-medium border-l-2 border-amber-500 pl-3 py-1">
            {nudge.message}
          </p>
          <p className="text-slate-500 text-xs mt-1">{nudge.type}</p>
        </div>
      )}
    </div>
  );
}
