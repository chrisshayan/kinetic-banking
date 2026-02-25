'use client';

import { useState, useEffect } from 'react';

type OntologyAction = { id: string; domain: string; description?: string };

type NBAData = {
  domain: string;
  action: string;
  confidence: number;
  reasoning?: string;
  displayMessage?: string;
  ontologyDriven?: boolean;
  ontologyActions?: OntologyAction[];
  lifeStageTriggeredActions?: OntologyAction[];
  selectedFromOntology?: string;
  lifeStage?: string;
  neo4jBrowserUrl?: string;
  neo4jTriggersUrl?: string;
  neo4jPathUrl?: string;
};

export function CLOSection() {
  const [customerId, setCustomerId] = useState('');
  const [nba, setNba] = useState<NBAData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [neo4jConnected, setNeo4jConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/ontology/status')
      .then((r) => r.json())
      .then((d) => setNeo4jConnected(d.connected))
      .catch(() => setNeo4jConnected(false));
  }, []);

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
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-green-400">CLO — Next-Best-Action</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            neo4jConnected === null
              ? 'bg-slate-700 text-slate-400'
              : neo4jConnected
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          Neo4j: {neo4jConnected === null ? '…' : neo4jConnected ? 'connected' : 'disconnected'}
        </span>
      </div>
      <p className="text-slate-400 text-xs mb-3">
        Try: sarah-chen (run <a href="/demo" className="text-cyan-400 hover:underline">Run Demo</a> first) or
        demo-acquisition, demo-activation, demo-expansion, demo-retention
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
            <span>
              Domain: <strong className="text-slate-200">{nba.domain}</strong>
            </span>
            <span>
              Action: <strong className="text-slate-200">{nba.action}</strong>
            </span>
            <span>
              Confidence: <strong className="text-slate-200">{(nba.confidence * 100).toFixed(0)}%</strong>
            </span>
          </div>
          {nba.reasoning && <p className="text-slate-500 text-xs">{nba.reasoning}</p>}
          {nba.ontologyDriven && nba.ontologyActions && nba.ontologyActions.length > 0 && (
            <div className="mt-2 p-3 rounded bg-slate-800/50 border border-emerald-500/20">
              <p className="text-emerald-400/90 text-xs font-medium mb-2">Neo4j ontology</p>
              {nba.lifeStage && nba.lifeStageTriggeredActions && nba.lifeStageTriggeredActions.length > 0 && (
                <p className="text-slate-400 text-xs mb-1">
                  <span className="text-cyan-400">{nba.lifeStage}</span> → TRIGGERS →{' '}
                  {nba.lifeStageTriggeredActions.map((a) => a.id).join(', ')}
                </p>
              )}
              <p className="text-slate-400 text-xs mb-1">
                Domain <span className="text-cyan-400">{nba.domain}</span> → IN_DOMAIN →{' '}
                {nba.ontologyActions.map((a) => a.id).join(', ')}
              </p>
              {nba.selectedFromOntology && (
                <p className="text-slate-300 text-xs mb-2">
                  Selected: <strong className="text-emerald-400">{nba.selectedFromOntology}</strong>
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                {nba.neo4jPathUrl && (
                  <a
                    href={nba.neo4jPathUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    View path (life_stage → TRIGGERS → Action → domain)
                  </a>
                )}
                {nba.neo4jTriggersUrl && (
                  <a
                    href={nba.neo4jTriggersUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    TRIGGERS only
                  </a>
                )}
                {nba.neo4jBrowserUrl && (
                  <a
                    href={nba.neo4jBrowserUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    IN_DOMAIN only
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
