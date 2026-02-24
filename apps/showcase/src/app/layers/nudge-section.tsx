'use client';

import { useState } from 'react';

const NUDGE_TYPES = [
  { id: 'transactional', label: 'Transactional Data', desc: 'Transaction-based nudges' },
  { id: 'pockets', label: 'Pockets & Budgets', desc: 'Budget alerts and suggestions' },
  { id: 'fdp', label: 'Financial Development Plan', desc: 'Goal-based recommendations' },
  { id: 'insights', label: 'User Financial Insights', desc: 'Personalized insights' },
] as const;

const DOMAIN_MAP: Record<string, string> = {
  transactional: 'weekly_reflection',
  pockets: 'early_warnings',
  fdp: 'health_assessment',
  insights: 'peer_benchmarking',
};

export function NudgeSection() {
  const [customerId, setCustomerId] = useState('demo-activation');
  const [type, setType] = useState<(typeof NUDGE_TYPES)[number]['id']>('transactional');
  const [nudge, setNudge] = useState<{ message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setNudge(null);
    try {
      const res = await fetch('/api/coach/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, domain: DOMAIN_MAP[type] ?? 'weekly_reflection' }),
      });
      const data = await res.json();
      if (res.ok) setNudge(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
      <h3 className="font-semibold text-amber-400 mb-3">Coach Nudge Outputs</h3>
      <p className="text-slate-400 text-xs mb-3">
        Transactional, Pockets & Budgets, FDP, User Insights
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="text"
          placeholder="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm w-36"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as (typeof NUDGE_TYPES)[number]['id'])}
          className="px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm"
        >
          {NUDGE_TYPES.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
        <button
          onClick={generate}
          disabled={loading}
          className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? '...' : 'Generate'}
        </button>
      </div>
      {nudge && (
        <p className="text-amber-200 text-sm border-l-2 border-amber-500 pl-3 py-1">
          {nudge.message}
        </p>
      )}
    </div>
  );
}
