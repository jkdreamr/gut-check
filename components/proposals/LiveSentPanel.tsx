'use client';
import { useEffect, useState } from 'react';
import { shortDid } from '@/lib/utils';
import type { SentCirclesResponse } from '@/lib/types';

export function LiveSentPanel() {
  const [data, setData] = useState<SentCirclesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/circle/sent', { cache: 'no-store' });
      const json = (await res.json()) as SentCirclesResponse & { error?: string };
      if (json.error) setError(json.error);
      else setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-300">Live from Newnal</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight text-white">Circle delivery view</h2>
          <p className="mt-1 text-xs text-slate-400">
            This panel reads Newnal&apos;s own `/circle/sent` history. It is independent of the local proposal log above.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="rounded-md border border-white/[0.15] px-3 py-1.5 text-xs hover:border-white/30 disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {error && (
        <div className="rounded-lg border border-rose-700 bg-rose-900/30 p-3 text-xs text-rose-200">
          {error}
        </div>
      )}
      {!data ? (
        <p className="text-xs text-slate-500">Loading delivery history from Newnal…</p>
      ) : data.recipients.length === 0 ? (
        <p className="text-xs text-slate-400">No Circles have been sent yet through this Service Agent.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recipients.map((r) => (
            <div key={r.personal_ai_did} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-cyan-300/[0.15] text-xs font-semibold text-cyan-200">
                  {(r.personal_ai_name ?? '?')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{r.personal_ai_name ?? 'Personal AI'}</p>
                  <p className="truncate font-mono text-[10px] text-slate-400">{shortDid(r.personal_ai_did)}</p>
                </div>
                <span className="ml-auto text-[10px] text-slate-400">{r.total_circles ?? r.circles.length} sent</span>
              </div>
              <ul className="space-y-2">
                {r.circles.slice(0, 4).map((c) => (
                  <li key={c.circle_id} className="border-l-2 border-cyan-300/70 pl-3 py-1">
                    <p className="text-sm">{c.circle_title}</p>
                    {c.circle_message && (
                      <p className="line-clamp-2 text-[11px] text-slate-400">{c.circle_message}</p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-500">
                      {new Date(c.created_at).toLocaleString()} · {c.is_active ? 'active' : 'closed'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
