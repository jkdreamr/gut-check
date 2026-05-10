'use client';

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  BrainCircuit,
  CreditCard,
  LocateFixed,
  MapPin,
  RefreshCw,
  Send,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { ProposalCard } from '@/components/proposals/ProposalCard';
import { ThinkingState } from '@/components/ui/ThinkingState';
import { CURATED_DEMO_MOMENTS } from '@/lib/curated-demo-moments';
import { isGeneratedScenarioId } from '@/lib/scenarios';
import { initials, scenarioBadgeClass } from '@/lib/utils';
import type {
  AnalyzeResponse,
  DecisionMoment,
} from '@/lib/types';

interface PresentationTarget {
  id: string;
  name: string;
  label: string;
  contextLine: string;
  source: 'demo' | 'live';
  moments: DecisionMoment[];
}

interface PresentationOption {
  id: string;
  userId: string;
  userName: string;
  label: string;
  contextLine: string;
  source: 'demo' | 'live';
  moment: DecisionMoment;
}

interface LiveDemoPanelProps {
  initialLiveTarget?: PresentationTarget | null;
  initialError?: string;
}

const DEMO_TARGETS: PresentationTarget[] = [
  {
    id: 'demo:alex',
    name: 'Alex Park',
    label: '28 · San Francisco',
    contextLine: 'Healthy identity, inconsistent follow-through',
    source: 'demo',
    moments: CURATED_DEMO_MOMENTS.filter((moment) => moment.userId === 'demo:alex'),
  },
  {
    id: 'demo:jordan',
    name: 'Jordan Reyes',
    label: '34 · Palo Alto',
    contextLine: 'Social decision, strong friend signal',
    source: 'demo',
    moments: CURATED_DEMO_MOMENTS.filter((moment) => moment.userId === 'demo:jordan'),
  },
  {
    id: 'demo:sam',
    name: 'Sam Chen',
    label: '26 · Menlo Park',
    contextLine: 'Dormant goal, nearby opportunity',
    source: 'demo',
    moments: CURATED_DEMO_MOMENTS.filter((moment) => moment.userId === 'demo:sam'),
  },
  {
    id: 'demo:maya',
    name: 'Maya Patel',
    label: '31 · San Francisco',
    contextLine: 'Tasteful buyer, repeat audio regret',
    source: 'demo',
    moments: CURATED_DEMO_MOMENTS.filter((moment) => moment.userId === 'demo:maya'),
  },
  {
    id: 'demo:leo',
    name: 'Leo Brooks',
    label: '38 · Mountain View',
    contextLine: 'Quiet renewal bleed, overloaded attention',
    source: 'demo',
    moments: CURATED_DEMO_MOMENTS.filter((moment) => moment.userId === 'demo:leo'),
  },
];

export function LiveDemoPanel({
  initialLiveTarget = null,
  initialError,
}: LiveDemoPanelProps) {
  const [active, setActive] = useState(0);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    circleId?: string;
    success: boolean;
    error?: string;
    logWarning?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [geoState, setGeoState] = useState<{
    mode: 'loading' | 'live' | 'demo';
    label: string;
    latitude?: number;
    longitude?: number;
  }>({
    mode: 'loading',
    label: 'Requesting browser location…',
  });

  const targets = useMemo(() => {
    return initialLiveTarget
      ? [initialLiveTarget, ...DEMO_TARGETS]
      : DEMO_TARGETS;
  }, [initialLiveTarget]);

  const options = useMemo<PresentationOption[]>(() => {
    return targets.flatMap((target) =>
      target.moments.map((moment) => ({
        id: `${target.id}:${moment.id}`,
        userId: target.id,
        userName: target.name,
        label: target.label,
        contextLine: target.contextLine,
        source: target.source,
        moment,
      })),
    );
  }, [targets]);

  const selected = options[active] ?? options[0];
  const effectiveMoment = useMemo(() => {
    if (!selected) return undefined;
    if (geoState.mode !== 'live' || !selected.moment.location) return selected.moment;
    return {
      ...selected.moment,
      source: selected.source === 'live' ? 'live' : selected.moment.source,
      location: {
        ...selected.moment.location,
        source: 'live',
        permission: 'granted',
        latitude: geoState.latitude,
        longitude: geoState.longitude,
      },
    } satisfies DecisionMoment;
  }, [geoState, selected]);

  const primaryProposal = analysis?.topProposals.find(
    (proposal) => proposal.scenario.scenarioId === analysis.autonomy.primaryScenarioId,
  ) ?? analysis?.topProposals[0];
  const primaryCandidate = analysis?.autonomy.candidates.find(
    (candidate) => candidate.scenarioId === analysis.autonomy.primaryScenarioId,
  ) ?? analysis?.autonomy.candidates[0];

  useEffect(() => {
    setAnalysis(null);
    setSendResult(null);
    setError(initialError ?? null);
  }, [active, initialError]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoState({
        mode: 'demo',
        label: 'Browser location unavailable. Falling back to demo location.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState({
          mode: 'live',
          label: 'Live browser location granted.',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setGeoState({
          mode: 'demo',
          label: 'Location denied. Using the moment’s demo location instead.',
        });
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 4_500 },
    );
  }, []);

  async function runIntercept() {
    if (!selected) return;
    setRunning(true);
    setError(null);
    setAnalysis(null);
    setSendResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selected.userId,
          name: selected.userName,
          mode: 'default',
          moment: effectiveMoment,
        }),
      });
      const data = (await res.json()) as AnalyzeResponse & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setAnalysis(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setRunning(false);
    }
  }

  async function sendLivePing() {
    if (!selected || !primaryProposal) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selected.userId,
          userName: selected.userName,
          scenarioId: primaryProposal.scenario.scenarioId,
          scenarioName: primaryProposal.scenario.scenarioName,
          scenarioType: primaryProposal.scenario.scenarioType,
          confidence: primaryProposal.scenario.confidence,
          evidence: primaryProposal.scenario.evidencePoints,
          headline: primaryProposal.headline,
          body: primaryProposal.body,
        }),
      });
      const data = (await res.json()) as {
        circleId?: string;
        success: boolean;
        error?: string;
        logWarning?: string;
      };
      setSendResult(data);
      if (!res.ok || !data.success) {
        setError(data.error ?? `HTTP ${res.status}`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSending(false);
    }
  }

  const canSend = analysis?.autonomy.recommendedAction === 'send_now' && Boolean(primaryProposal);

  return (
    <main className="relative min-h-screen">
      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 space-y-8">
        <section className="panel-elevated p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill icon={<Sparkles className="size-3.5" />} label="Newnal Service Agent" />
                <StatusPill icon={<CreditCard className="size-3.5" />} label="Payment signal" />
                <StatusPill icon={<MapPin className="size-3.5" />} label="Location signal" />
                <StatusPill icon={<BrainCircuit className="size-3.5" />} label="Autonomy trace" />
              </div>
              <h1 className="mt-4 font-display text-4xl tracking-[-0.03em] text-white md:text-5xl">
                Gut Check catches decision moments before they become regrets.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Gut Check reads history, place, habits, and timing, then decides whether a short message is actually worth sending.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="app-button-secondary px-4 py-2.5"
              >
                App home
              </Link>
              <Link
                href="/users"
                className="app-button-secondary px-4 py-2.5"
              >
                People
              </Link>
              <button
                type="button"
                onClick={runIntercept}
                disabled={running || sending || !selected}
                className="app-button-primary disabled:opacity-50"
              >
                {running ? 'Checking...' : 'Run check'}
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <Panel
              kicker="Decision Moments"
              title="Pick a moment"
              body="Each card is a live or demo moment where the person is about to choose."
            >
              <div className="space-y-3">
                {options.map((option, index) => {
                  const selectedCard = index === active;
                  const isLiveTarget = option.source === 'live';
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setActive(index)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        selectedCard
                          ? 'border-cyan-300/[0.24] bg-cyan-300/[0.08] text-white shadow-[0_15px_40px_rgba(126,231,255,0.08)]'
                          : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex size-11 items-center justify-center rounded-2xl font-semibold ${selectedCard ? 'bg-white/10 text-cyan-200' : 'bg-white/[0.05] text-slate-200'}`}>
                          {initials(option.userName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`text-sm font-semibold ${selectedCard ? 'text-white' : 'text-white'}`}>
                              {option.userName}
                            </p>
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${selectedCard ? 'border-white/10 text-cyan-200' : 'border-white/10 text-slate-400'}`}>
                              {isLiveTarget ? 'Live target' : 'Demo'}
                            </span>
                          </div>
                          <p className={`mt-1 text-xs ${selectedCard ? 'text-slate-300' : 'text-slate-400'}`}>
                            {option.label} · {option.contextLine}
                          </p>
                          <p className={`mt-3 text-sm ${selectedCard ? 'text-white' : 'text-white'}`}>
                            {option.moment.title}
                          </p>
                          <p className={`mt-1 text-xs leading-relaxed ${selectedCard ? 'text-slate-300' : 'text-slate-400'}`}>
                            {option.moment.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel
              kicker="Location Layer"
              title={geoState.mode === 'live' ? 'Live location available' : 'Demo location fallback'}
              body={geoState.label}
            >
              <div className="grid grid-cols-2 gap-3 text-sm">
                <SignalInfo
                  icon={geoState.mode === 'live' ? <LocateFixed className="size-4" /> : <WifiOff className="size-4" />}
                  label="Location mode"
                  value={geoState.mode}
                />
                <SignalInfo
                  icon={<MapPin className="size-4" />}
                  label="Moment place"
                  value={effectiveMoment?.location?.placeName ?? 'No place signal'}
                />
              </div>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel
              kicker="Incoming Moment"
              title={effectiveMoment?.title ?? 'Choose a moment'}
              body={effectiveMoment?.description ?? 'Pick a moment to start the check.'}
            >
              {effectiveMoment && (
                <>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <SignalCard
                      icon={<CreditCard className="size-4" />}
                      title="Payment signal"
                      value={
                        effectiveMoment.transaction
                          ? `${effectiveMoment.transaction.merchantName} · $${effectiveMoment.transaction.amount}`
                          : 'No payment signal'
                      }
                      meta={
                        effectiveMoment.transaction
                          ? `${effectiveMoment.transaction.status} · ${effectiveMoment.transaction.source}`
                          : 'Location-only moment'
                      }
                    />
                    <SignalCard
                      icon={<MapPin className="size-4" />}
                      title="Location signal"
                      value={effectiveMoment.location?.placeName ?? 'No place signal'}
                      meta={
                        effectiveMoment.location
                          ? `${effectiveMoment.location.source} · ${effectiveMoment.location.distanceMeters ?? '—'}m`
                          : 'No distance available'
                      }
                    />
                  </div>
                  {effectiveMoment.signalSummary && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {effectiveMoment.signalSummary.map((signal) => (
                        <span
                          key={signal}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Panel>

            <Panel
              kicker="Decision Trace"
              title="How the agent earns the right to interrupt"
              body="The trace shows what the agent saw, which patterns matched, and why it chose to send or stay quiet."
            >
              <div className="space-y-4">
                <TraceStep
                  index={1}
                  title="Signal intake"
                  body={effectiveMoment
                    ? `${effectiveMoment.title} reached the agent as a ${effectiveMoment.source} moment with payment and location context.`
                    : 'Pick a moment to start the check.'}
                  active
                />
                <TraceStep
                  index={2}
                  title="Scenario candidates"
                  body={
                    analysis
                      ? `${analysis.results.length} patterns matched the moment and the person’s history.`
                      : 'The core rules and any fresh WaveSpeed cases will show up here after you run the check.'
                  }
                  active={Boolean(analysis)}
                />
                <TraceStep
                  index={3}
                  title="Autonomy decision"
                  body={
                    analysis
                      ? `${analysis.autonomy.summaryHeadline} ${analysis.autonomy.summaryBody}`
                      : 'Gut Check then decides whether silence or interruption is the better outcome.'
                  }
                  active={Boolean(analysis)}
                />
                <TraceStep
                  index={4}
                  title="Notification outcome"
                  body={
                    sendResult?.success
                      ? `Ping sent${sendResult.circleId ? ` · ${sendResult.circleId}` : ''}.`
                      : canSend
                      ? 'If the model says send_now, you can send the message from the panel on the right.'
                      : 'If the model says hold, the demo shows why it stayed quiet.'
                  }
                  active={Boolean(sendResult || analysis)}
                />
              </div>
            </Panel>

            <Panel
              kicker="Scenario Stack"
              title="Candidate interventions"
              body="Warnings and nudges are ranked by evidence, timing, novelty, fatigue, and what has worked before."
            >
              {!analysis ? (
                running ? (
                  <ThinkingState
                    title="Reading the moment"
                    body="The agent is scoring the live signal, matching patterns, and deciding whether the interrupt is actually worth it."
                  />
                ) : (
                  <EmptyState>
                    Run the check to see candidate scenarios and the exact decision trace.
                  </EmptyState>
                )
              ) : (
                <div className="space-y-3">
                  {analysis.topProposals.map((proposal) => {
                    const candidate = analysis.autonomy.candidates.find(
                      (entry) => entry.scenarioId === proposal.scenario.scenarioId,
                    );
                    if (!candidate) return null;
                    return (
                      <div
                        key={proposal.scenario.scenarioId}
                        className="panel-muted p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${scenarioBadgeClass(proposal.scenario.scenarioType)}`}>
                            {proposal.scenario.scenarioName}
                          </span>
                          <MiniStat label="send" value={`${Math.round(candidate.sendScore * 100)}%`} />
                          <MiniStat label="floor" value={`${Math.round(candidate.adaptiveFloor * 100)}%`} />
                          <MiniStat label="timing" value={`${Math.round(candidate.timingScore * 100)}%`} />
                          <MiniStat label="moment" value={`${Math.round(candidate.momentAlignment * 100)}%`} />
                          {isGeneratedScenarioId(proposal.scenario.scenarioId) && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-700">
                              Fresh case
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-sm font-semibold text-white">{proposal.headline}</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-300">{candidate.decisionExplanation}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel
              kicker="Phone Preview"
              title="What the user would actually receive"
              body="The final notification stays short, personal, and grounded in the evidence that earned the interrupt."
            >
              <div className="flex justify-center">
                {primaryProposal ? (
                  <ProposalCard
                    isLive
                    size="lg"
                    headline={primaryProposal.headline}
                    body={primaryProposal.body}
                    scenarioName={primaryProposal.scenario.scenarioName}
                    scenarioType={primaryProposal.scenario.scenarioType}
                  />
                ) : (
                  <div className="panel-muted flex h-[500px] w-[260px] items-center justify-center border-dashed px-8 text-center text-sm text-slate-400">
                    Run the check to render the final phone preview.
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={sendLivePing}
                  disabled={!canSend || sending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-slate-900 disabled:opacity-50"
                >
                  {sending ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {selected?.source === 'live' ? 'Send live ping' : 'Simulate phone ping'}
                </button>
                {selected?.source === 'live' && (
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
                    This target is live. If the agent says yes, this sends a real Newnal Circle to that person.
                  </div>
                )}
                {!canSend && analysis && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    The agent chose to hold. That is part of the point.
                  </div>
                )}
                {sendResult?.success && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                    {selected?.source === 'live' ? 'The ping was sent to the Newnal phone.' : 'Demo send completed successfully.'}
                    {sendResult.circleId ? ` Circle ID: ${sendResult.circleId}.` : ''}
                    {sendResult.logWarning ? ` ${sendResult.logWarning}` : ''}
                  </div>
                )}
                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}
              </div>
            </Panel>

            <Panel
              kicker="Winning Policy Trace"
              title={analysis?.autonomy.summaryHeadline ?? 'No decision yet'}
              body={analysis?.autonomy.summaryBody ?? 'Run the moment to see the final send, watch, or hold posture.'}
            >
              {!analysis || !primaryCandidate ? (
                <EmptyState>
                  The autonomy trace will appear here once the agent has ranked the moment.
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  <TraceMetric label="Scenario confidence" value={`${Math.round(primaryCandidate.confidence * 100)}%`} />
                  <TraceMetric label="Timing score" value={`${Math.round(primaryCandidate.timingScore * 100)}%`} />
                  <TraceMetric label="Behavior fit" value={`${Math.round(primaryCandidate.behaviorFit * 100)}%`} />
                  <TraceMetric label="Historical acceptance" value={primaryCandidate.historicalAcceptance === null ? 'Cold start' : `${Math.round(primaryCandidate.historicalAcceptance * 100)}%`} />
                  <TraceMetric label="Novelty" value={`${Math.round(primaryCandidate.noveltyBoost * 100)}%`} />
                  <TraceMetric label="Fatigue penalty" value={`${Math.round(primaryCandidate.fatiguePenalty * 100)}%`} />
                  <TraceMetric label="Moment alignment" value={`${Math.round(primaryCandidate.momentAlignment * 100)}%`} />
                  <TraceMetric label="Final send score" value={`${Math.round(primaryCandidate.sendScore * 100)}%`} />
                  <TraceMetric label="Adaptive floor" value={`${Math.round(primaryCandidate.adaptiveFloor * 100)}%`} />
                  <TraceMetric label="Decision" value={primaryCandidate.posture} />
                </div>
              )}
            </Panel>
          </div>
        </section>

        <section className="panel-soft p-6">
          <p className="app-kicker">Architecture Strip</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
            {[
              'Newnal Personal AI',
              'Decision Moment',
              '11 Core Rules',
              'Autonomy Policy',
              'Notification Copy',
              'Newnal Circle + Feedback',
            ].map((step, index) => (
              <div key={step} className="panel-muted flex items-center gap-3 px-4 py-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-cyan-300/[0.08] text-[11px] font-semibold text-cyan-200">
                  {index + 1}
                </span>
                <span className="text-sm text-slate-200">{step}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({
  kicker,
  title,
  body,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="panel-soft p-5">
      <p className="app-kicker">{kicker}</p>
      <h2 className="mt-2 font-display text-2xl tracking-tight text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatusPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="app-pill">
      {icon}
      {label}
    </span>
  );
}

function SignalCard({
  icon,
  title,
  value,
  meta,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="panel-muted p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.18em]">{title}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{meta}</p>
    </div>
  );
}

function SignalInfo({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="panel-muted p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function TraceStep({
  index,
  title,
  body,
  active,
}: {
  index: number;
  title: string;
  body: string;
  active: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${active ? 'bg-cyan-300/[0.08] text-cyan-200' : 'bg-white/[0.05] text-slate-500'}`}>
        {index}
      </div>
      <div className="panel-muted flex-1 px-4 py-3">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">{body}</p>
      </div>
    </div>
  );
}

function TraceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-muted flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
      {label} {value}
    </span>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="panel-muted border-dashed px-4 py-8 text-center text-sm text-slate-400">
      {children}
    </div>
  );
}
