export default function EventsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-cyan-400 mb-6">Event Stream</h1>
        <p className="text-slate-400 mb-4">
          Live Kafka events: mifos.transactions, mifos.accounts, customer.events
        </p>
        <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50 min-h-[300px] font-mono text-sm">
          <p className="text-slate-500">Event stream placeholder (WebSocket + Kafka consumer)</p>
        </div>
      </div>
    </main>
  );
}
