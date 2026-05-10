'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ProposalCard } from '@/components/proposals/ProposalCard';
import { initials, scenarioBadgeClass } from '@/lib/utils';
import type { AnalyzeResponse } from '@/lib/types';
import { Sparkles, ArrowLeft, Play, BrainCircuit, Send, ShieldBan } from 'lucide-react';

const DEMO_USERS = [
  { id: 'demo:alex', name: 'Alex Park', label: '28 · San Francisco', expected: 'Ghost Gym' },
  { id: 'demo:jordan', name: 'Jordan Reyes', label: '34 · Palo Alto', expected: 'Friend Warning' },
  { id: 'demo:sam', name: 'Sam Chen', label: '26 · Menlo Park', expected: 'Dormant Interest' },
];

export function LiveDemoPanel() {
  const [active, setActive] = useState(0);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [phase, setPhase] = useState<'idle' | 'sensing' | 'deciding' | 'sending' | 'sent' | 'held'>('idle');
  const [acceptanceRate, setAcceptanceRate] = useState(67);
  const [error, setError] = useState<string | null>(null);
  const [dispatchId, setDispatchId] = useState<string | null>(null);

  const user = DEMO_USERS[active];
  const primaryProposal = analysis?.topProposals.find(
    (proposal) => proposal.scenario.scenarioId === analysis.autonomy.primaryScenarioId,
  ) ?? analysis?.topProposals[0];

  async function fire() {
    setPhase('sensing');
    setError(null);
    setDispatchId(null);

    try {
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: user.name }),
      });
      const analyzeData = (await analyzeRes.json()) as AnalyzeResponse & { error?: string };
      if (!analyzeRes.ok || analyzeData.error) {
        setError(analyzeData.error ?? `HTTP ${analyzeRes.status}`);
        setPhase('idle');
        return;
      }

      setAnalysis(analyzeData);
      setPhase('deciding');

      if (analyzeData.autonomy.recommendedAction !== 'send_now' || !analyzeData.autonomy.primaryScenarioId) {
        setTimeout(() => setPhase('held'), 900);
        return;
      }

      const proposal = analyzeData.topProposals.find(
        (entry) => entry.scenario.scenarioId === analyzeData.autonomy.primaryScenarioId,
      );
      if (!proposal) {
        setTimeout(() => setPhase('held'), 900);
        return;
      }

      setTimeout(async () => {
        setPhase('sending');
        const sendRes = await fetch('/api/propose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            userName: user.name,
            scenarioId: proposal.scenario.scenarioId,
            scenarioName: proposal.scenario.scenarioName,
            scenarioType: proposal.scenario.scenarioType,
            confidence: proposal.scenario.confidence,
            evidence: proposal.scenario.evidencePoints,
            headline: proposal.headline,
            body: proposal.body,
          }),
        });
        const sendData = (await sendRes.json()) as { circleId?: string; success: boolean; error?: string };
        if (!sendRes.ok || !sendData.success) {
          setError(sendData.error ?? `HTTP ${sendRes.status}`);
          setPhase('held');
          return;
        }

        setDispatchId(sendData.circleId ?? null);
        setPhase('sent');
      }, 700);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('idle');
    }
  }

  useEffect(() => {
    setAnalysis(null);
    setPhase('idle');
    setDispatchId(null);
  }, [active]);

  useEffect(() => {
    if (phase === 'sent') {
      const timer = setTimeout(() => {
        setAcceptanceRate((value) => Math.min(95, value + 4));
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase]);

  const topCandidate = analysis?.autonomy.candidates[0];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#fff7ed_45%,_#ecfeff_100%)] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-slate-950 text-cyan-300 flex items-center justify-center">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none text-slate-950">The Gut Check · Autonomous Live Demo</p>
              <p className="text-sm text-slate-600 mt-1.5">
                The model decides whether to intervene, which scenario wins, and when the Circle should fire.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-950 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-[11px] uppercase tracking-wider text-slate-500">Pick a user</h2>
            {DEMO_USERS.map((candidate, index) => (
              <button
                key={candidate.id}
                type="button"
                onClick={() => setActive(index)}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  active === index
                    ? 'border-cyan-300 bg-white shadow-sm'
                    : 'border-slate-200 bg-white/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="size-11 rounded-full bg-gradient-to-br from-cyan-100 to-amber-100 flex items-center justify-center text-slate-900 font-semibold">
                    {initials(candidate.name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-950">{candidate.name}</p>
                    <p className="text-xs text-slate-500">{candidate.label}</p>
                    <p className="text-[11px] text-cyan-700 mt-1">Expected trigger: {candidate.expected}</p>
                  </div>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={fire}
              disabled={phase === 'sensing' || phase === 'sending' || phase === 'deciding'}
              className="w-full mt-2 bg-slate-950 hover:bg-slate-900 disabled:opacity-50 text-cyan-300 text-sm font-medium px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md"
            >
              <Play className="size-4" />
              {phase === 'sensing'
                ? 'Sensing…'
                : phase === 'deciding'
                ? 'Model deciding…'
                : phase === 'sending'
                ? 'Dispatching…'
                : 'Let Autopilot Run'}
            </button>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs">
                {error}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-[11px] uppercase tracking-wider text-slate-500">Autonomy Stack</h2>
            <Step n={1} label="Sense live user context + synthesize missing signals" active={phase !== 'idle'} icon={<BrainCircuit className="size-4" />} />
            <Step n={2} label="Run 11 scenarios and compute adaptive AI send floors" active={phase === 'deciding' || phase === 'sending' || phase === 'sent' || phase === 'held'} icon={<Sparkles className="size-4" />} />
            <Step n={3} label="Choose: dispatch now or hold for a better moment" active={phase === 'sending' || phase === 'sent' || phase === 'held'} icon={phase === 'held' ? <ShieldBan className="size-4" /> : <Send className="size-4" />} />

            {analysis && topCandidate && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">AI Decision</p>
                  <p className="text-lg font-semibold text-slate-950 mt-1">{analysis.autonomy.summaryHeadline}</p>
                  <p className="text-sm text-slate-600 mt-1">{analysis.autonomy.summaryBody}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${scenarioBadgeClass(topCandidate.scenarioType)}`}>
                    {topCandidate.scenarioName}
                  </span>
                  <Badge label="Send Score" value={`${Math.round(topCandidate.sendScore * 100)}%`} />
                  <Badge label="Floor" value={`${Math.round(topCandidate.adaptiveFloor * 100)}%`} />
                  <Badge label="Prediction" value={`${Math.round(topCandidate.acceptancePrediction * 100)}%`} />
                </div>
                <ul className="space-y-1.5">
                  {analysis.autonomy.narrative.map((line) => (
                    <li key={line} className="text-xs text-slate-600 flex gap-2">
                      <span className="text-cyan-600">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                {dispatchId && (
                  <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    Sent automatically · {dispatchId}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Acceptance counter</p>
              <p className="text-3xl font-semibold mt-1 tabular-nums text-slate-950">{acceptanceRate}%</p>
              <p className="text-xs text-slate-500 mt-1">across the live demo audience</p>
            </div>
          </div>

          <div className="lg:col-span-4 flex items-start justify-center">
            <div className="relative">
              {primaryProposal && phase === 'sent' ? (
                <div className="animate-fade-in">
                  <ProposalCard
                    isLive
                    size="lg"
                    headline={primaryProposal.headline}
                    body={primaryProposal.body}
                    scenarioName={primaryProposal.scenario.scenarioName}
                    scenarioType={primaryProposal.scenario.scenarioType}
                  />
                </div>
              ) : (
                <div className="w-[260px] h-[500px] rounded-[2rem] border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 text-center px-8 bg-white/70">
                  {phase === 'idle' && 'Click "Let Autopilot Run" to watch the model make the decision.'}
                  {phase === 'sensing' && 'Sensing the user profile, context, and synthetic signals…'}
                  {phase === 'deciding' && 'Computing adaptive floors and choosing whether interruption is justified…'}
                  {phase === 'sending' && 'Dispatching the winning proposal to the phone…'}
                  {phase === 'held' && 'Autopilot held the line. The model chose silence over a weak intervention.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
      `}</style>
    </main>
  );
}

function Step({
  n,
  label,
  active,
  icon,
}: {
  n: number;
  label: string;
  active: boolean;
  icon: ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 transition-colors ${active ? 'border-cyan-300 shadow-sm' : 'border-slate-200'}`}>
      <div className={`size-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${active ? 'bg-slate-950 text-cyan-300' : 'bg-slate-100 text-slate-500'}`}>
        {n}
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-900">{label}</p>
      </div>
      <div className={active ? 'text-cyan-600' : 'text-slate-400'}>{icon}</div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-600">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-900">{value}</span>
    </span>
  );
}
