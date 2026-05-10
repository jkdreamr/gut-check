'use client';

import { useState } from 'react';
import { ProposalCard } from '@/components/proposals/ProposalCard';
import { scenarioBadgeClass } from '@/lib/utils';
import type { AnalyzeResponse } from '@/lib/types';

type ProposalEntry = AnalyzeResponse['topProposals'][number];

interface Props {
  userId: string;
  userName: string;
}

export function AnalyzePanel({ userId, userName }: Props) {
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState<number>(0);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<Record<string, { circleId?: string; success: boolean; error?: string }>>({});
  const [error, setError] = useState<string | null>(null);

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
      setSendResults((prev) => ({ ...prev, [entry.scenario.scenarioId]: data }));
      return data;
    } finally {
      setSending(false);
    }
  }

  async function runAnalysis() {
    setRunning(true);
    setError(null);
    setSendResults({});
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: userName }),
      });
      const data = (await res.json()) as AnalyzeResponse & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }

      setAnalysis(data);
      const primaryIndex = Math.max(
        data.topProposals.findIndex(
          (proposal) => proposal.scenario.scenarioId === data.autonomy.primaryScenarioId,
        ),
        0,
      );
      setActive(primaryIndex);

      if (data.autonomy.recommendedAction === 'send_now' && data.autonomy.primaryScenarioId) {
        const primaryProposal = data.topProposals.find(
          (proposal) => proposal.scenario.scenarioId === data.autonomy.primaryScenarioId,
        );
        if (primaryProposal) {
          await sendProposal(primaryProposal);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  const proposals = analysis?.topProposals ?? [];
  const candidateMap = new Map(
    (analysis?.autonomy.candidates ?? []).map((candidate) => [candidate.scenarioId, candidate]),
  );
  const activeProposal = proposals[active] ?? null;
  const activeCandidate = activeProposal
    ? candidateMap.get(activeProposal.scenario.scenarioId) ?? null
    : null;
  const primaryScenarioId = analysis?.autonomy.primaryScenarioId;
  const primaryResult = primaryScenarioId ? sendResults[primaryScenarioId] : undefined;

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
      <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
              Autopilot Engaged
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
              Operator Involvement: 0
            </span>
          </div>
          <h2 className="text-xl font-semibold text-white">AI Decision Layer</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            The model now owns scenario gating, confidence floors, and send timing. Humans no longer tune thresholds here.
          </p>
        </div>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={running || sending}
          className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
        >
          {running ? 'Running Autopilot…' : analysis ? 'Re-run Autopilot' : 'Run Autopilot'}
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-6 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!analysis ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12">
            <p className="text-sm text-slate-300">
              Launch autopilot to let the model decide whether {userName} should be interrupted at all, which scenario wins, and whether the proposal should fire immediately.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-6 py-6 grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          <div className="xl:col-span-3 space-y-4">
            <DecisionBanner
              action={analysis.autonomy.recommendedAction}
              summaryHeadline={analysis.autonomy.summaryHeadline}
              summaryBody={analysis.autonomy.summaryBody}
              primaryResult={primaryResult}
              sending={sending}
            />

            {proposals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center text-sm text-slate-300">
                No scenario crossed the model-owned activation logic for this user.
              </div>
            ) : (
              proposals.map((entry, index) => {
                const candidate = candidateMap.get(entry.scenario.scenarioId);
                if (!candidate) return null;
                const sent = sendResults[entry.scenario.scenarioId];
                const isPrimary = entry.scenario.scenarioId === primaryScenarioId;

                return (
                  <button
                    key={entry.scenario.scenarioId}
                    type="button"
                    onClick={() => setActive(index)}
                    className={`w-full text-left rounded-2xl border p-5 transition-all ${
                      index === active
                        ? 'border-cyan-300/60 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(103,232,249,0.2)]'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${scenarioBadgeClass(entry.scenario.scenarioType)}`}>
                        {entry.scenario.scenarioName}
                      </span>
                      <MetricChip label="Send Score" value={`${Math.round(candidate.sendScore * 100)}%`} />
                      <MetricChip label="Predicted Acceptance" value={`${Math.round(candidate.acceptancePrediction * 100)}%`} />
                      <MetricChip label="Adaptive Floor" value={`${Math.round(candidate.adaptiveFloor * 100)}%`} />
                      <MetricChip
                        label="Posture"
                        value={
                          candidate.posture === 'send_now'
                            ? 'Fire'
                            : candidate.posture === 'watch'
                            ? 'Watch'
                            : 'Hold'
                        }
                      />
                      {isPrimary && (
                        <span className="inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-white">{entry.headline}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{entry.body}</p>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
                      <SignalBar label="Timing" value={candidate.timingScore} />
                      <SignalBar label="Behavior Fit" value={candidate.behaviorFit} />
                      <SignalBar label="Evidence" value={candidate.confidence} />
                      <SignalBar label="Fatigue Penalty" value={1 - candidate.fatiguePenalty} />
                    </div>

                    <ul className="mt-4 space-y-1.5">
                      {candidate.reasons.map((reason) => (
                        <li key={reason} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="mt-0.5 text-cyan-300">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>

                    {sent && (
                      <div className={`mt-4 rounded-xl px-3 py-2 text-xs ${sent.success ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
                        {sent.success
                          ? `Sent automatically · circle ${sent.circleId?.slice(0, 12)}…`
                          : `Dispatch failed · ${sent.error?.slice(0, 120)}`}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="xl:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Policy Summary</p>
              <p className="mt-2 text-lg font-semibold text-white">{analysis.autonomy.summaryHeadline}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{analysis.autonomy.summaryBody}</p>
              <div className="mt-4 space-y-2">
                {analysis.autonomy.narrative.map((line) => (
                  <div key={line} className="rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200">
                    {line}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                <span className="rounded-full border border-white/10 px-2.5 py-1">
                  Policy Model: {analysis.autonomy.policyModel}
                </span>
                <span className="rounded-full border border-white/10 px-2.5 py-1">
                  Action: {analysis.autonomy.recommendedAction === 'send_now' ? 'Dispatch' : 'Hold'}
                </span>
              </div>
            </div>

            {activeProposal && activeCandidate ? (
              <>
                <div className="flex justify-center">
                  <ProposalCard
                    isLive
                    size="md"
                    headline={activeProposal.headline}
                    body={activeProposal.body}
                    scenarioName={activeProposal.scenario.scenarioName}
                    scenarioType={activeProposal.scenario.scenarioType}
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Creative Direction</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {activeCandidate.creativeDirection}
                  </p>
                </div>
              </>
            ) : (
              <div className="h-[420px] rounded-[2rem] border border-dashed border-white/15 bg-white/5 flex items-center justify-center text-center text-sm text-slate-400 px-8">
                Autopilot did not find a candidate worth rendering to the phone.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function DecisionBanner({
  action,
  summaryHeadline,
  summaryBody,
  primaryResult,
  sending,
}: {
  action: AnalyzeResponse['autonomy']['recommendedAction'];
  summaryHeadline: string;
  summaryBody: string;
  primaryResult?: { circleId?: string; success: boolean; error?: string };
  sending: boolean;
}) {
  const tone =
    action === 'send_now'
      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
      : 'border-amber-400/30 bg-amber-500/10 text-amber-100';

  return (
    <div className={`rounded-2xl border px-5 py-4 ${tone}`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-[11px] uppercase tracking-[0.2em]">
          {action === 'send_now' ? 'Autonomous Dispatch' : 'Autonomous Hold'}
        </span>
        {sending && <span className="text-[11px] uppercase tracking-[0.2em]">Dispatching…</span>}
        {primaryResult?.success && (
          <span className="text-[11px] uppercase tracking-[0.2em]">
            Sent · {primaryResult.circleId?.slice(0, 12)}…
          </span>
        )}
      </div>
      <p className="text-lg font-semibold">{summaryHeadline}</p>
      <p className="mt-1 text-sm opacity-90">{summaryBody}</p>
      {primaryResult && !primaryResult.success && (
        <p className="mt-2 text-sm text-rose-100">
          Dispatch failed: {primaryResult.error?.slice(0, 120)}
        </p>
      )}
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-100">{value}</span>
    </span>
  );
}

function SignalBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</span>
        <span className="text-[11px] text-slate-200">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-cyan-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
