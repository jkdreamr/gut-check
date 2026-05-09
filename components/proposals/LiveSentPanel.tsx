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
    <section className="bg-gray-900 text-white rounded-xl p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-semibold">Live from Newnal · /circle/sent</h2>
          <p className="text-xs text-gray-400 mt-1">
            Real Newnal-side history of Newnal-Circles this Service Agent has sent. Independent of the local log above.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="border border-gray-600 hover:border-gray-400 text-xs px-3 py-1.5 rounded-md disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {error && (
        <div className="bg-rose-900/30 border border-rose-700 text-rose-200 rounded-lg p-3 text-xs">
          {error}
        </div>
      )}
      {!data ? (
        <p className="text-xs text-gray-500">Loading from Newnal Plaza…</p>
      ) : data.recipients.length === 0 ? (
        <p className="text-xs text-gray-400">No Circles sent yet through this Service Agent.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recipients.map((r) => (
            <div key={r.personal_ai_did} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-9 rounded-full bg-rose-500 flex items-center justify-center text-xs font-semibold">
                  {(r.personal_ai_name ?? '?')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{r.personal_ai_name ?? 'Personal AI'}</p>
                  <p className="text-[10px] font-mono text-gray-400 truncate">{shortDid(r.personal_ai_did)}</p>
                </div>
                <span className="ml-auto text-[10px] text-gray-400">{r.total_circles ?? r.circles.length} sent</span>
              </div>
              <ul className="space-y-2">
                {r.circles.slice(0, 4).map((c) => (
                  <li key={c.circle_id} className="border-l-2 border-rose-500 pl-3 py-1">
                    <p className="text-sm">{c.circle_title}</p>
                    {c.circle_message && (
                      <p className="text-[11px] text-gray-400 line-clamp-2">{c.circle_message}</p>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1">
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
