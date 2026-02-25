'use client';

import { useState, useEffect } from 'react';

type Step = 'idle' | 'seeding' | 'nba' | 'nudge' | 'feedback' | 'done';

type Scenario = { id: string; name: string; domain: string; desc: string };

const DEFAULT_SCENARIOS: Scenario[] = [
  { id: 'sarah-chen', name: 'Sarah Chen', domain: 'EXPANSION', desc: 'ACTIVE, 3 accounts → set_up_budget' },
  { id: 'demo-acquisition', name: 'Jordan Prospect', domain: 'ACQUISITION', desc: 'PENDING, no accounts → sign_up' },
  { id: 'demo-activation', name: 'Sam Newcomer', domain: 'ACTIVATION', desc: 'NEW_TO_BANK, 1 account → complete_onboarding' },
  { id: 'demo-expansion', name: 'Alex Power User', domain: 'EXPANSION', desc: 'ACTIVE, 2 accounts → add_savings' },
  { id: 'demo-retention', name: 'Casey At Risk', domain: 'RETENTION', desc: 'CHURN_RISK → win_back' },
];

type NBAData = {
  domain: string;
  action: string;
  displayMessage?: string;
  ontologyDriven?: boolean;
  ontologyActions?: { id: string; domain: string; description?: string }[];
  selectedFromOntology?: string;
  neo4jBrowserUrl?: string;
};

interface DemoState {
  step: Step;
  seedOk?: boolean;
  neo4jConnected?: boolean;
  nba?: NBAData;
  nudge?: { domain: string; message: string };
  error?: string;
}

export default function DemoPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('sarah-chen');
  const [state, setState] = useState<DemoState>({ step: 'idle' });
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch('/api/demo/scenarios')
      .then((r) => r.json())
      .then(setScenarios)
      .catch(() => setScenarios(DEFAULT_SCENARIOS));
  }, []);

  async function runDemo() {
    const customerId = selectedScenario;
    setRunning(true);
    setState({ step: 'idle' });

    try {
      setState((s) => ({ ...s, step: 'seeding' }));
      const [seedRes, neo4jRes] = await Promise.all([
        fetch('/api/demo/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: customerId }),
        }),
        fetch('/api/ontology/status'),
      ]);
      if (!seedRes.ok) throw new Error('Seed failed');
      const seedData = await seedRes.json();
      const neo4jData = await neo4jRes.json().catch(() => ({ connected: false }));
      setState((s) => ({
        ...s,
        step: 'seeding',
        seedOk: seedData.ok,
        neo4jConnected: neo4jData.connected,
      }));

      setState((s) => ({ ...s, step: 'nba' }));
      const nbaRes = await fetch('/api/clo/nba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      if (!nbaRes.ok) {
        const err = await nbaRes.json();
        throw new Error(err.error ?? 'NBA failed');
      }
      const nba = await nbaRes.json();
      setState((s) => ({ ...s, step: 'nba', nba }));

      setState((s) => ({ ...s, step: 'nudge' }));
      const nudgeRes = await fetch('/api/coach/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, domain: 'weekly_reflection' }),
      });
      if (!nudgeRes.ok) throw new Error('Nudge failed');
      const nudge = await nudgeRes.json();
      setState((s) => ({ ...s, step: 'nudge', nudge }));

      setState((s) => ({ ...s, step: 'feedback' }));
      await new Promise((r) => setTimeout(r, 500));
      setState((s) => ({ ...s, step: 'done' }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Demo failed',
      }));
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-cyan-400 mb-2">Run Demo</h1>
        <p className="text-slate-400 text-sm mb-6">
          End-to-end flow: Seed Sarah → NBA (Neo4j ontology) → Coach Nudge → Feedback Loop
        </p>

        <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 mb-6">
          <p className="text-emerald-400 text-xs font-medium mb-2">Pipeline</p>
          <p className="text-slate-400 text-xs font-mono mb-2">
            Neo4j Ontology → CLO → Kafka (decisions.outcomes) → Writeback → Decision History → MLflow
          </p>
            <p className="text-slate-500 text-xs">
            Pick a scenario below. Each routes to a different CLO domain (ACQUISITION, ACTIVATION, EXPANSION,
            RETENTION). Neo4j returns actions for that domain; CLO selects the first not yet in decision history.
          </p>
        </div>

        <div className="mb-6">
          <p className="text-slate-400 text-xs font-medium mb-2">Scenario</p>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            disabled={running}
            className="w-full max-w-md px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm text-slate-200"
          >
            {(scenarios.length === 0 ? DEFAULT_SCENARIOS : scenarios).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.domain}: {s.desc}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={runDemo}
          disabled={running}
          className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 font-medium mb-6"
        >
          {running ? 'Running…' : 'Run Demo'}
        </button>

        {state.error && (
          <p className="text-red-400 text-sm mb-4">
            {state.error}
            <br />
            <span className="text-slate-500">
              Ensure: Docker, Postgres, Kafka, Writeback, Neo4j running. Run: pnpm isc:seed-ontology
            </span>
          </p>
        )}

        <div className="space-y-4">
          <StepRow
            label="1. Seed"
            status={state.step === 'seeding' ? 'running' : state.step !== 'idle' ? 'done' : 'pending'}
            detail={state.seedOk ? `${selectedScenario} seeded` : undefined}
            sub={state.seedOk ? 'Customer + accounts + decision history' : undefined}
          />
          <StepRow
            label="2. NBA (CLO)"
            status={state.step === 'nba' ? 'running' : state.step !== 'idle' && state.step !== 'seeding' ? 'done' : 'pending'}
            detail={state.nba?.displayMessage}
            sub={
              state.nba?.ontologyDriven
                ? `Neo4j: ${state.nba.ontologyActions?.map((a) => a.id).join(', ')} → ${state.nba.selectedFromOntology ?? state.nba.action}`
                : state.neo4jConnected === false
                  ? 'Neo4j disconnected (rule-based fallback)'
                  : undefined
            }
          />
          <StepRow
            label="3. Nudge (Coach)"
            status={state.step === 'nudge' ? 'running' : state.step === 'feedback' || state.step === 'done' ? 'done' : 'pending'}
            detail={state.nudge?.message}
          />
          <StepRow
            label="4. Feedback Loop"
            status={state.step === 'done' ? 'done' : 'pending'}
            detail="Decision → Kafka → Writeback → Decision History"
          />
        </div>

        {state.step === 'done' && state.nba?.ontologyDriven && state.nba.neo4jBrowserUrl && (
          <div className="mt-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-emerald-400 text-xs font-medium mb-2">Neo4j ontology</p>
            <p className="text-slate-400 text-xs mb-2">
              Domain <strong>{state.nba.domain}</strong> → Actions:{' '}
              {state.nba.ontologyActions?.map((a) => a.id).join(', ')} → Selected:{' '}
              <strong className="text-emerald-400">{state.nba.selectedFromOntology ?? state.nba.action}</strong>
            </p>
            <a
              href={state.nba.neo4jBrowserUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline text-xs"
            >
              View in Neo4j Browser →
            </a>
          </div>
        )}

        {state.step === 'done' && (
          <div className="mt-6 p-4 rounded-lg border border-slate-700 bg-slate-900/50">
            <p className="text-slate-400 text-sm mb-2">View results</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/api/customer-truth/${selectedScenario}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline text-sm"
              >
                Customer Truth
              </a>
              <a href="/layers" className="text-cyan-400 hover:underline text-sm">
                Layer Explorer
              </a>
              <a href="/events" className="text-cyan-400 hover:underline text-sm">
                Event Stream
              </a>
              {state.nba?.neo4jBrowserUrl && (
                <a
                  href={state.nba.neo4jBrowserUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline text-sm"
                >
                  Neo4j Browser
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StepRow({
  label,
  status,
  detail,
  sub,
}: {
  label: string;
  status: 'pending' | 'running' | 'done';
  detail?: string;
  sub?: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <span
        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
          status === 'done' ? 'bg-emerald-500/30 text-emerald-400' : status === 'running' ? 'bg-cyan-500/30 text-cyan-400 animate-pulse' : 'bg-slate-700 text-slate-500'
        }`}
      >
        {status === 'done' ? '✓' : status === 'running' ? '…' : '○'}
      </span>
      <div>
        <p className="text-slate-300 text-sm">{label}</p>
        {detail && <p className="text-slate-500 text-xs mt-0.5">{detail}</p>}
        {sub && <p className="text-slate-600 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
