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

  async function setAccepted(id: string, accepted: boolean | null) {
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, accepted } : l)));
    await fetch('/api/proposals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, accepted }),
    });
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500">
        No proposals sent yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
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
              <tr key={log.id} className="border-b last:border-0 border-gray-100">
                <Td>
                  <span className="text-xs text-gray-500">
                    {new Date(log.sentAt).toLocaleString()}
                  </span>
                </Td>
                <Td>
                  <span className="font-medium text-gray-900 text-sm">{log.userName}</span>
                  <span className="block text-[10px] text-gray-400 font-mono">{shortDid(log.userId)}</span>
                </Td>
                <Td>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${scenarioBadgeClass(log.scenarioType as 'warning' | 'nudge')}`}>
                    {log.scenarioName}
                  </span>
                </Td>
                <Td>
                  <span className="text-sm text-gray-900">{log.headline}</span>
                  <span className="block text-xs text-gray-500 line-clamp-1">{log.body}</span>
                </Td>
                <Td>
                  <span className="text-sm tabular-nums text-gray-700">
                    {Math.round(log.confidence * 100)}%
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAccepted(log.id, log.accepted === true ? null : true)}
                      className={`text-[11px] px-2 py-1 rounded-md ${
                        log.accepted === true
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Accepted
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccepted(log.id, log.accepted === false ? null : false)}
                      className={`text-[11px] px-2 py-1 rounded-md ${
                        log.accepted === false
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Dismissed
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}
