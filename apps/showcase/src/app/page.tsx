export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">Kinetic Banking OS</h1>
        <p className="text-slate-400 mb-8">Banking OS Full Vision — Showcase</p>
        <div className="grid gap-4 text-sm">
          <a href="/layers" className="block p-4 rounded-lg border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50 transition">
            Layer Explorer
          </a>
          <a href="/chat" className="block p-4 rounded-lg border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50 transition">
            Financial Coach Chat
          </a>
          <a href="/events" className="block p-4 rounded-lg border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50 transition">
            Event Stream
          </a>
        </div>
        <div className="mt-8 p-4 rounded-lg border border-slate-700 bg-slate-900/50 text-slate-400 text-xs">
          <p className="font-medium text-slate-300 mb-2">API endpoints (all on port 3000)</p>
          <ul className="space-y-1 font-mono">
            <li><a href="/api/customer-truth/health" className="text-cyan-400 hover:underline">/api/customer-truth/health</a></li>
            <li><a href="/api/customer-truth/demo-customer" className="text-cyan-400 hover:underline">/api/customer-truth/demo-customer</a></li>
            <li><a href="/api/clo/health" className="text-cyan-400 hover:underline">/api/clo/health</a></li>
            <li><a href="/api/coach/health" className="text-cyan-400 hover:underline">/api/coach/health</a></li>
            <li><a href="/api/cdp/health" className="text-cyan-400 hover:underline">/api/cdp/health</a></li>
          </ul>
          <p className="font-medium text-slate-300 mt-4 mb-2">CDP (RudderStack) — POST</p>
          <ul className="space-y-1 font-mono">
            <li>/api/cdp/track — body: {"{ userId, event, properties }"}</li>
            <li>/api/cdp/identify — body: {"{ userId, traits }"}</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
