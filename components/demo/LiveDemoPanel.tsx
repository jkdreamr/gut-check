'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProposalCard } from '@/components/proposals/ProposalCard';
import { initials, scenarioBadgeClass } from '@/lib/utils';
import type { ScenarioResultTriggered } from '@/lib/types';
import { Sparkles, ArrowLeft, Play } from 'lucide-react';

const DEMO_USERS = [
  { id: 'demo:alex', name: 'Alex Park', label: '28 · San Francisco', expected: 'Ghost Gym' },
  { id: 'demo:jordan', name: 'Jordan Reyes', label: '34 · Palo Alto', expected: 'Friend Warning' },
  { id: 'demo:sam', name: 'Sam Chen', label: '26 · Menlo Park', expected: 'Dormant Interest' },
];

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

export function LiveDemoPanel() {
  const [active, setActive] = useState(0);
  const [analysis, setAnalysis] = useState<AnalyzeResp | null>(null);
  const [phase, setPhase] = useState<'idle' | 'analyzing' | 'firing' | 'sent'>('idle');
  const [acceptanceRate, setAcceptanceRate] = useState(67);
  const [error, setError] = useState<string | null>(null);

  const user = DEMO_USERS[active];

  async function fire() {
    setPhase('analyzing');
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: user.name }),
      });
      const data = (await res.json()) as AnalyzeResp & { error?: string };
      if (data.error) {
        setError(data.error);
        setPhase('idle');
        return;
      }
      // Simulate the slight delay of arriving at the phone.
      setTimeout(() => {
        setAnalysis(data);
        setPhase('firing');
        setTimeout(() => setPhase('sent'), 1100);
      }, 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('idle');
    }
  }

  useEffect(() => {
    setAnalysis(null);
    setPhase('idle');
  }, [active]);

  // Tiny interactive bump on the acceptance counter so the demo feels alive.
  useEffect(() => {
    if (phase === 'sent') {
      const t = setTimeout(() => setAcceptanceRate((r) => Math.min(95, r + 4)), 600);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const top = analysis?.topProposals[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-rose-500 text-white flex items-center justify-center">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">The Gut Check · Live</p>
              <p className="text-sm text-gray-600 mt-1.5">
                Three users. One Service Agent. Personalized proposals at the moment of decision.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left — user picker */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-[11px] uppercase tracking-wider text-gray-500">Pick a user</h2>
            {DEMO_USERS.map((u, i) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setActive(i)}
                className={`w-full text-left bg-white rounded-xl border p-4 transition-all ${
                  active === i ? 'border-rose-300 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="size-11 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center text-rose-700 font-semibold">
                    {initials(u.name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.label}</p>
                    <p className="text-[11px] text-rose-600 mt-1">Expected trigger: {u.expected}</p>
                  </div>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={fire}
              disabled={phase === 'analyzing' || phase === 'firing'}
              className="w-full mt-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md"
            >
              <Play className="size-4" />
              {phase === 'analyzing'
                ? 'Analyzing…'
                : phase === 'firing'
                ? 'Firing proposal…'
                : 'Fire Gut Check'}
            </button>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Center — flow */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-[11px] uppercase tracking-wider text-gray-500">Pipeline</h2>
            <Step n={1} label="Discover via /personal-ai/search" active={phase !== 'idle'} />
            <Step n={2} label="Adapt + run 11 rule scenarios" active={phase === 'firing' || phase === 'sent'} />
            <Step n={3} label="Generate proposal copy (template)" active={phase === 'firing' || phase === 'sent'} />
            <Step n={4} label="Send via /circle/template" active={phase === 'sent'} />

            {analysis && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 mt-4">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">
                  Triggered scenarios for {user.name}
                </p>
                <ul className="space-y-2">
                  {analysis.results.map((r) => (
                    <li key={r.scenarioId} className="flex items-center gap-2 text-xs">
                      <span className={`uppercase tracking-wider px-2 py-0.5 rounded-full text-[10px] ${scenarioBadgeClass(r.scenarioType)}`}>
                        {r.scenarioName}
                      </span>
                      <span className="text-gray-500">{Math.round(r.confidence * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">Acceptance counter</p>
              <p className="text-3xl font-semibold mt-1 tabular-nums">{acceptanceRate}%</p>
              <p className="text-xs text-gray-500 mt-1">across the live demo audience</p>
            </div>
          </div>

          {/* Right — phone mockup */}
          <div className="lg:col-span-4 flex items-start justify-center">
            <div className="relative">
              {top && phase === 'sent' ? (
                <div className="animate-fade-in">
                  <ProposalCard
                    isLive
                    size="lg"
                    headline={top.headline}
                    body={top.body}
                    scenarioName={top.scenario.scenarioName}
                    scenarioType={top.scenario.scenarioType}
                  />
                </div>
              ) : (
                <div className="w-[260px] h-[500px] rounded-[2rem] border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 text-center px-8 bg-white/60">
                  {phase === 'idle' && 'Click "Fire Gut Check" to send a proposal to this user.'}
                  {phase === 'analyzing' && 'Analyzing user data through 11 scenarios…'}
                  {phase === 'firing' && 'Generating + sending Newnal-Circle…'}
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

function Step({ n, label, active }: { n: number; label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-3 bg-white rounded-lg border px-4 py-3 transition-colors ${active ? 'border-rose-300 shadow-sm' : 'border-gray-200'}`}>
      <div className={`size-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${active ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
        {n}
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}
