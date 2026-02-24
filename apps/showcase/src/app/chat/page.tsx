'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'coach';
  content: string;
  domain?: string;
}

export default function ChatPage() {
  const [customerId, setCustomerId] = useState('demo-activation');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = message.trim();
    if (!text || loading) return;

    setMessage('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, message: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed');
        return;
      }

      setMessages((m) => [
        ...m,
        { role: 'coach', content: data.reply, domain: data.domain },
      ]);
    } catch {
      setError('Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-amber-400 mb-2">Financial Coach</h1>
        <p className="text-slate-400 text-sm mb-4">
          Ask about your financial health, spending, or how you compare to others.
        </p>

        <div className="mb-4">
          <label className="text-xs text-slate-500 block mb-1">Customer ID</label>
          <input
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="demo-activation"
            className="px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm w-full"
          />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/50 min-h-[300px] flex flex-col">
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[400px]">
            {messages.length === 0 && (
              <p className="text-slate-500 text-sm">
                Try: &quot;How is my financial health?&quot; or &quot;Compare me to peers&quot; or
                &quot;Weekly summary&quot;
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-cyan-600/30 text-cyan-100'
                      : 'bg-amber-500/10 text-amber-100 border border-amber-500/20'
                  }`}
                >
                  {msg.domain && (
                    <span className="text-xs text-amber-400/80 block mb-1">
                      {msg.domain.replace(/_/g, ' ')}
                    </span>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
                  <span className="text-amber-400 animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask the Coach..."
              className="flex-1 px-4 py-2 rounded bg-slate-800 border border-slate-600 text-sm focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-sm font-medium"
            >
              Send
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
    </main>
  );
}
