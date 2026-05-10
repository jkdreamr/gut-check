'use client';
import { useState } from 'react';
import { scenarioBadgeClass, shortDid } from '@/lib/utils';

interface Log {
  id: string;
  userId: string;
  userName: string;
  scenarioId: string;
  scenarioName: string;
  scenarioType: string;
  confidence: number;
  headline: string;
  body: string;
  evidence: string[];
  sentAt: string;
  accepted: boolean | null;
  newnalCircleId: string | null;
}

export function ProposalsTable({ logs: initial }: { logs: Log[] }) {
  const [logs, setLogs] = useState(initial);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setAccepted(id: string, accepted: boolean | null) {
    setError(null);
    setSavingId(id);
    const previous = logs;
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, accepted } : l)));

    try {
      const res = await fetch('/api/proposals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accepted }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok || json.error) {
        setLogs(previous);
        setError(json.error ?? `HTTP ${res.status}`);
      }
    } catch (cause) {
      setLogs(previous);
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSavingId(null);
    }
  }

  if (logs.length === 0) {
    return (
      <div className="panel-soft border-dashed p-12 text-center text-sm text-slate-400">
        No message history yet. Run the demo or open a real person and the learning loop will start here.
      </div>
    );
  }

  return (
    <section className="panel-soft overflow-hidden">
      <div className="border-b border-white/[0.08] px-6 py-5">
        <p className="app-kicker">Proposal history</p>
        <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">What Gut Check actually sent</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
              This is the local feedback loop. Mark accepted or dismissed outcomes so the autonomy layer learns when a warning earned the interrupt.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-slate-400">
            {logs.length} logged proposals
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.08] px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/[0.08] bg-white/[0.03]">
            <tr className="text-left">
              <Th>Sent</Th>
              <Th>User</Th>
              <Th>Scenario</Th>
              <Th>Headline</Th>
              <Th>Confidence</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/[0.06] last:border-0">
                <Td>
                  <span className="text-xs text-slate-400">
                    {new Date(log.sentAt).toLocaleString()}
                  </span>
                </Td>
                <Td>
                  <span className="text-sm font-medium text-white">{log.userName}</span>
                  <span className="block font-mono text-[10px] text-slate-500">{shortDid(log.userId)}</span>
                </Td>
                <Td>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${scenarioBadgeClass(log.scenarioType as 'warning' | 'nudge')}`}>
                    {log.scenarioName}
                  </span>
                  {log.evidence.length > 0 && (
                    <span className="mt-2 block text-[11px] text-slate-400">
                      {log.evidence.length} evidence points
                    </span>
                  )}
                </Td>
                <Td>
                  <span className="text-sm text-white">{log.headline}</span>
                  <span className="block line-clamp-1 text-xs text-slate-400">{log.body}</span>
                </Td>
                <Td>
                  <span className="text-sm tabular-nums text-slate-200">
                    {Math.round(log.confidence * 100)}%
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAccepted(log.id, log.accepted === true ? null : true)}
                      disabled={savingId === log.id}
                      className={`text-[11px] px-2 py-1 rounded-md ${
                        log.accepted === true
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.10]'
                      }`}
                    >
                      {savingId === log.id && log.accepted === true ? 'Saving…' : 'Accepted'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccepted(log.id, log.accepted === false ? null : false)}
                      disabled={savingId === log.id}
                      className={`text-[11px] px-2 py-1 rounded-md ${
                        log.accepted === false
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.10]'
                      }`}
                    >
                      {savingId === log.id && log.accepted === false ? 'Saving…' : 'Dismissed'}
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}
