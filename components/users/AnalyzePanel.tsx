'use client';

import { useState } from 'react';
import { ProposalCard } from '@/components/proposals/ProposalCard';
import { ThinkingState } from '@/components/ui/ThinkingState';
import { isGeneratedScenarioId } from '@/lib/scenarios';
import { scenarioBadgeClass } from '@/lib/utils';
import type { AnalyzeResponse, DecisionMoment } from '@/lib/types';

type ProposalEntry = AnalyzeResponse['topProposals'][number];

interface Props {
  userId: string;
  userName: string;
  moments?: DecisionMoment[];
}

export function AnalyzePanel({ userId, userName, moments = [] }: Props) {
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState<number>(0);
  const [momentIndex, setMomentIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<Record<string, {
    circleId?: string;
    success: boolean;
    error?: string;
    logWarning?: string;
  }>>({});
  const [error, setError] = useState<string | null>(null);
  const selectedMoment = moments[momentIndex];

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
      const data = (await res.json()) as {
        circleId?: string;
        success: boolean;
        error?: string;
        logWarning?: string;
      };
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
        body: JSON.stringify({
          userId,
          name: userName,
          mode: 'default',
          moment: selectedMoment,
        }),
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
    <section className="panel-elevated overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
              Live decision
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
              Real send path
            </span>
          </div>
          <h2 className="text-xl font-semibold text-white">Should this person get a ping?</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Gut Check looks at the moment, scores the options, and sends only if the case is strong enough.
          </p>
        </div>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={running || sending}
          className="app-button-primary px-4 py-2.5 disabled:opacity-50"
        >
          {running ? 'Checking...' : analysis ? 'Run again' : 'Run check'}
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-6 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {moments.length > 0 && (
        <div className="mx-6 mt-6 grid grid-cols-1 xl:grid-cols-3 gap-3">
          {moments.map((moment, index) => {
            const selected = index === momentIndex;
            return (
              <button
                key={moment.id}
                type="button"
                onClick={() => setMomentIndex(index)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  selected
                    ? 'border-cyan-300/60 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(103,232,249,0.18)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  <span>{moment.kind}</span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px]">
                    {moment.source}
                  </span>
                  {moment.transaction?.status && (
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] text-emerald-200">
                      {moment.transaction.status}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{moment.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{moment.description}</p>
                {moment.signalSummary && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {moment.signalSummary.slice(0, 3).map((signal) => (
                      <span
                        key={signal}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-300"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!analysis ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto max-w-xl">
            {running ? (
              <ThinkingState
                title="Checking the moment"
                body={`Gut Check is ranking the strongest reasons to message ${userName}, then deciding if the ping should really go out.`}
              />
            ) : (
              <div className="panel-muted border-dashed px-6 py-12">
                <p className="text-sm text-slate-300">
                  Run a check to see whether {userName} should get a message right now, which scenario wins, and whether the ping should go out immediately.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-6 py-6 grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          <div className="xl:col-span-3 space-y-4">
            <DecisionBanner
              action={analysis.autonomy.recommendedAction}
              summaryHeadline={analysis.autonomy.summaryHeadline}
              summaryBody={analysis.autonomy.summaryBody}
              moment={analysis.decisionMoment}
              primaryResult={primaryResult}
              sending={sending}
            />

            {proposals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.15] bg-white/5 px-6 py-12 text-center text-sm text-slate-300">
                Nothing strong enough to send right now.
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
                      <MetricChip label="Moment Align." value={`${Math.round(candidate.momentAlignment * 100)}%`} />
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
                      {isGeneratedScenarioId(entry.scenario.scenarioId) && (
                        <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100">
                          Fresh case
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-white">{entry.headline}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{entry.body}</p>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
                      <SignalBar label="Timing" value={candidate.timingScore} />
                      <SignalBar label="Behavior Fit" value={candidate.behaviorFit} />
                      <SignalBar label="Evidence" value={candidate.confidence} />
                      <SignalBar label="Novelty" value={candidate.noveltyBoost * 8} />
                      <SignalBar label="Fatigue Penalty" value={1 - candidate.fatiguePenalty} />
                    </div>

                    <div className="mt-4 rounded-xl bg-white/5 px-3 py-3 text-sm text-slate-200">
                      {candidate.decisionExplanation}
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
                      <div className={`mt-4 rounded-xl px-3 py-2 text-xs ${sent.success ? 'bg-emerald-500/[0.15] text-emerald-200' : 'bg-rose-500/[0.15] text-rose-200'}`}>
                        {sent.success
                          ? `Sent automatically · circle ${sent.circleId?.slice(0, 12)}…`
                          : `Dispatch failed · ${sent.error?.slice(0, 120)}`}
                        {sent.success && sent.logWarning ? ` · ${sent.logWarning}` : ''}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="xl:col-span-2 space-y-4">
            <div className="panel-muted p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Policy Summary</p>
              <p className="mt-2 text-lg font-semibold text-white">{analysis.autonomy.summaryHeadline}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{analysis.autonomy.summaryBody}</p>
              <div className="mt-4 space-y-2">
                {analysis.autonomy.narrative.map((line) => (
                  <div key={line} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
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
                <div className="panel-muted p-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Creative Direction</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {activeCandidate.creativeDirection}
                  </p>
                </div>
              </>
            ) : (
              <div className="panel-muted flex h-[420px] items-center justify-center border-dashed px-8 text-center text-sm text-slate-400">
                No message made it far enough to show on the phone.
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
  moment,
  primaryResult,
  sending,
}: {
  action: AnalyzeResponse['autonomy']['recommendedAction'];
  summaryHeadline: string;
  summaryBody: string;
  moment?: DecisionMoment;
  primaryResult?: { circleId?: string; success: boolean; error?: string; logWarning?: string };
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
        {moment && (
          <span className="text-[11px] uppercase tracking-[0.2em] opacity-80">
            {moment.title}
          </span>
        )}
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
      {primaryResult?.success && primaryResult.logWarning && (
        <p className="mt-2 text-sm text-amber-100">
          Sent to Newnal, but the learning loop could not log it: {primaryResult.logWarning}
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
