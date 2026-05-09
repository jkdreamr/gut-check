'use client';
import { useState } from 'react';
import { ProposalCard } from '@/components/proposals/ProposalCard';
import { scenarioBadgeClass } from '@/lib/utils';
import { SCENARIOS } from '@/lib/scenarios';
import type { ScenarioResultTriggered } from '@/lib/types';

interface ProposalEntry {
  scenario: ScenarioResultTriggered;
  headline: string;
  body: string;
  source: 'template' | 'claude';
}

interface AnalyzeResp {
  user: { id: string; displayName: string };
  results: ScenarioResultTriggered[];
  topProposals: ProposalEntry[];
}

interface Props {
  userId: string;
  userName: string;
}

export function AnalyzePanel({ userId, userName }: Props) {
  const [analysis, setAnalysis] = useState<AnalyzeResp | null>(null);
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<Record<string, { circleId?: string; success: boolean; error?: string }>>({});
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: userName, enabledScenarios: SCENARIOS.map((s) => s.id) }),
      });
      const data = (await res.json()) as AnalyzeResp & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setAnalysis(data);
        setActive(data.topProposals.length > 0 ? 0 : null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  async function sendProposal(entry: ProposalEntry) {
    setSending(true);
    try {
      const res = await fetch('/api/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName,
          scenarioId: entry.scenario.scenarioId,
          scenarioName: entry.scenario.scenarioName,
          scenarioType: entry.scenario.scenarioType,
          confidence: entry.scenario.confidence,
          evidence: entry.scenario.evidencePoints,
          headline: entry.headline,
          body: entry.body,
        }),
      });
      const data = (await res.json()) as { circleId?: string; success: boolean; error?: string };
      setSendResults((s) => ({ ...s, [entry.scenario.scenarioId]: data }));
    } finally {
      setSending(false);
    }
  }

  const triggered = analysis?.results ?? [];
  const proposals = analysis?.topProposals ?? [];
  const activeProposal = active !== null ? proposals[active] : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Run the Gut Check</h2>
          <p className="text-sm text-gray-500 mt-1">
            Analyze {userName}&apos;s data against all 11 scenarios. Top 3 hits become preview proposals.
          </p>
        </div>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={running}
          className="bg-gray-900 hover:bg-black disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          {running ? 'Running…' : analysis ? 'Re-run' : 'Run Gut Check'}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {!analysis ? (
        <div className="text-sm text-gray-500 py-12 text-center border border-dashed border-gray-200 rounded-lg">
          Click &ldquo;Run Gut Check&rdquo; to score this user against the 11 scenarios.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs text-gray-500 mb-2">
              {triggered.length} scenarios triggered · top {proposals.length} ready to send
            </p>
            {triggered.length === 0 ? (
              <div className="text-sm text-gray-500 py-8 text-center border border-dashed border-gray-200 rounded-lg">
                No scenarios triggered for this user. Try someone with a richer profile.
              </div>
            ) : (
              proposals.map((entry, i) => {
                const sent = sendResults[entry.scenario.scenarioId];
                return (
                  <div
                    key={entry.scenario.scenarioId}
                    className={`rounded-lg border p-4 cursor-pointer transition-all ${
                      i === active ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setActive(i)}
                  >
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={`uppercase tracking-wider px-2 py-0.5 rounded-full ${scenarioBadgeClass(entry.scenario.scenarioType)}`}>
                        {entry.scenario.scenarioName}
                      </span>
                      <span className="text-gray-400">
                        {Math.round(entry.scenario.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 mt-2">{entry.headline}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-snug">{entry.body}</p>
                    <ul className="mt-3 space-y-1">
                      {entry.scenario.evidencePoints.map((evidence, j) => (
                        <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-rose-400 mt-0.5">▪</span>
                          {evidence}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sendProposal(entry);
                        }}
                        disabled={sending}
                        className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-md"
                      >
                        Send this proposal
                      </button>
                      {sent && (
                        sent.success ? (
                          <span className="text-[11px] text-emerald-600">
                            Sent · circle {sent.circleId?.slice(0, 12)}…
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-600">
                            Failed: {sent.error?.slice(0, 80)}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="lg:col-span-2 flex justify-center">
            {activeProposal ? (
              <ProposalCard
                isLive
                size="md"
                headline={activeProposal.headline}
                body={activeProposal.body}
                scenarioName={activeProposal.scenario.scenarioName}
                scenarioType={activeProposal.scenario.scenarioType}
              />
            ) : (
              <div className="w-[220px] h-[420px] rounded-[2rem] border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 text-center px-6">
                No proposal selected
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
