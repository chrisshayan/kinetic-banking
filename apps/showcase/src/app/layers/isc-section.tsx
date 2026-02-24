'use client';

export function ISCSection() {
  const steps = [
    { name: 'Mifos Mock', url: 'http://localhost:3001', desc: 'Core banking (clients, accounts, txns)' },
    { name: 'Kafka', url: null, desc: 'mifos.clients, mifos.accounts, mifos.transactions' },
    { name: 'Kafka Consumer', url: null, desc: '→ PostgreSQL + OpenSearch' },
    { name: 'dbt', url: null, desc: 'Semantic layer (stg_*, fct_customer_health)' },
    { name: 'Feast', url: null, desc: 'Feature store (customer_health)' },
    { name: 'Neo4j', url: 'http://localhost:7474', desc: 'Ontology (actions, entities, concepts)' },
    { name: 'MLflow', url: 'http://localhost:5001', desc: 'Model registry (health score)' },
    { name: 'OPA', url: 'http://localhost:8181', desc: 'Guardrails (CLO decisions)' },
  ];

  return (
    <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
      <h3 className="font-semibold text-purple-400 mb-3">Intelligence Supply Chain</h3>
      <p className="text-slate-400 text-sm mb-4">
        Data flow: BaaS → Kafka → Transform → Ontology → ML → Decisions
      </p>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="text-purple-400 font-mono w-6">{i + 1}.</span>
            {step.url ? (
              <a
                href={step.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                {step.name}
              </a>
            ) : (
              <span className="text-slate-300">{step.name}</span>
            )}
            <span className="text-slate-500">— {step.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
