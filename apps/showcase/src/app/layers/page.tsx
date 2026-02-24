export default function LayersPage() {
  const layers = [
    { id: 'isc', name: 'Intelligence Supply Chain', color: 'purple' },
    { id: 'truth', name: 'Shared Source of Customer Truth', color: 'cyan' },
    { id: 'clo', name: 'CLO Decision Domains', color: 'green' },
    { id: 'coach', name: 'Financial Coach Decision Domains', color: 'amber' },
    { id: 'nudge', name: 'Financial Coach Nudge', color: 'amber' },
    { id: 'feedback', name: 'Outcome Feedback Loop', color: 'emerald' },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-cyan-400 mb-6">Layer Explorer</h1>
        <div className="space-y-3">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="p-4 rounded-lg border border-slate-700 bg-slate-900/50"
            >
              <span className="font-medium">{layer.name}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
