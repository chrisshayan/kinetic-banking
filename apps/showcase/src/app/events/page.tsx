'use client';

import { useEffect, useState } from 'react';

interface Event {
  id: string;
  eventType: 'transaction' | 'decision';
  source: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events?limit=50');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setEvents(data.events ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-cyan-400 mb-6">Event Stream</h1>
        <p className="text-slate-400 mb-4">
          Events from mifos.transactions, decisions.outcomes (refreshes every 5s)
        </p>
        <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50 min-h-[300px] font-mono text-sm overflow-auto max-h-[70vh]">
          {loading && <p className="text-slate-500">Loading...</p>}
          {error && <p className="text-rose-400">{error}</p>}
          {!loading && !error && events.length === 0 && (
            <p className="text-slate-500">No events yet. Run <code className="text-cyan-400">pnpm run db:seed-sarah</code> to seed demo data.</p>
          )}
          {!loading && !error && events.length > 0 && (
            <ul className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="flex gap-4 items-start border-b border-slate-700/50 pb-3 last:border-0">
                  <span className="text-slate-500 shrink-0">
                    {new Date(e.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                  </span>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs ${e.eventType === 'transaction' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {e.source}
                  </span>
                  <pre className="text-slate-300 overflow-x-auto flex-1">
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
