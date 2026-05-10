import { TopBar } from '@/components/layout/TopBar';
import { prisma } from '@/lib/prisma';
import { SCENARIOS } from '@/lib/scenarios';
import { deriveAdaptiveFloor } from '@/lib/autonomy';
import { scenarioBadgeClass } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type ScenarioTelemetry = {
  id: string;
  name: string;
  type: 'warning' | 'nudge';
  description: string;
  fired: number;
  accepted: number;
  acceptanceRate: number | null;
  adaptiveFloor: number;
  posture: string;
  note: string;
};

export default async function ScenariosPage() {
  const [counts, accepts, totalSent, totalAccepted] = await Promise.all([
    prisma.proposalLog.groupBy({
      by: ['scenarioId'],
      _count: { _all: true },
    }),
    prisma.proposalLog.groupBy({
      by: ['scenarioId'],
      where: { accepted: true },
      _count: { _all: true },
    }),
    prisma.proposalLog.count(),
    prisma.proposalLog.count({ where: { accepted: true } }),
  ]);

  const countById = Object.fromEntries(counts.map((row) => [row.scenarioId, row._count._all]));
  const acceptById = Object.fromEntries(accepts.map((row) => [row.scenarioId, row._count._all]));
  const telemetry = SCENARIOS.map((scenario) => {
    const fired = countById[scenario.id] ?? 0;
    const accepted = acceptById[scenario.id] ?? 0;
    const acceptanceRate = fired > 0 ? accepted / fired : null;
    const adaptiveFloor = deriveAdaptiveFloor(scenario.type, {
      fired,
      accepted,
      acceptanceRate,
    });

    return {
      id: scenario.id,
      name: scenario.name,
      type: scenario.type,
      description: scenario.longDescription,
      fired,
      accepted,
      acceptanceRate,
      adaptiveFloor,
      posture: postureLabel(fired, acceptanceRate, adaptiveFloor),
      note: governanceNote(scenario.type, fired, acceptanceRate, adaptiveFloor),
    } satisfies ScenarioTelemetry;
  });

  const warnings = telemetry.filter((scenario) => scenario.type === 'warning');
  const nudges = telemetry.filter((scenario) => scenario.type === 'nudge');
  const globalAcceptance = totalSent > 0 ? Math.round((totalAccepted / totalSent) * 100) : 0;

  return (
    <main>
      <TopBar
        title="AI Brain"
        subtitle="Human thresholds are retired. The autonomous policy layer now decides which scenarios deserve interruption rights."
      />
      <div className="px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Metric label="Operator involvement" value="0%" sub="model-owned gating + dispatch" />
          <Metric label="Adaptive floors" value={`${telemetry.length}`} sub="all scenarios self-governed" />
          <Metric label="Global acceptance" value={`${globalAcceptance}%`} sub={`${totalAccepted} accepted of ${totalSent}`} />
          <Metric label="Learning loop" value={totalSent === 0 ? 'Cold start' : 'Online'} sub="acceptance data feeding posture" />
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-300">Governance Doctrine</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <DoctrineCard
              title="Evidence beats knobs"
              body="Every rule still emits a confidence score, but the shipping floor is now adaptive and model-owned rather than manually tuned."
            />
            <DoctrineCard
              title="Silence is allowed"
              body="If timing is weak, fatigue is high, or acceptance priors are poor, the AI holds fire instead of forcing another proposal."
            />
            <DoctrineCard
              title="Outcomes reshape posture"
              body="Historical acceptance rates lower or raise the send floor automatically, so each scenario develops a live precision profile."
            />
          </div>
        </section>

        <ScenarioGroup label="Warnings · protective interventions" items={warnings} />
        <ScenarioGroup label="Nudges · momentum interventions" items={nudges} />
      </div>
    </main>
  );
}

function postureLabel(
  fired: number,
  acceptanceRate: number | null,
  adaptiveFloor: number,
) {
  if (fired === 0 || acceptanceRate === null) return 'Cold-start posture';
  if (acceptanceRate >= 0.55 && adaptiveFloor <= 0.56) return 'Aggressive dispatch';
  if (acceptanceRate <= 0.25 && adaptiveFloor >= 0.62) return 'Cautious dispatch';
  return 'Balanced dispatch';
}

function governanceNote(
  type: 'warning' | 'nudge',
  fired: number,
  acceptanceRate: number | null,
  adaptiveFloor: number,
) {
  if (fired === 0 || acceptanceRate === null) {
    return type === 'warning'
      ? 'No live feedback yet. The AI is starting from a defensive prior for interruption quality.'
      : 'No live feedback yet. The AI is starting slightly stricter on nudges until it sees conversion proof.';
  }
  if (acceptanceRate >= 0.55) {
    return `This scenario is earning trust, so the model is comfortable dispatching once its score clears ${Math.round(adaptiveFloor * 100)}%.`;
  }
  if (acceptanceRate <= 0.25) {
    return `This scenario has weak downstream acceptance, so the model raises the bar to ${Math.round(adaptiveFloor * 100)}% and prefers to wait.`;
  }
  return `This scenario is in a middle band. The model keeps a moderated floor at ${Math.round(adaptiveFloor * 100)}% while it gathers more evidence.`;
}

function ScenarioGroup({ label, items }: { label: string; items: ScenarioTelemetry[] }) {
  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-wider text-gray-400 mb-3">{label}</h2>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-medium tracking-wider px-2 py-0.5 rounded-full ${scenarioBadgeClass(item.type)}`}>
                    {item.type}
                  </span>
                  <p className="font-semibold text-sm text-slate-950">{item.name}</p>
                </div>
                <p className="text-sm text-slate-500 mt-2 max-w-2xl">{item.description}</p>
              </div>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-300">
                {item.posture}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <Stat label="Adaptive floor" value={`${Math.round(item.adaptiveFloor * 100)}%`} />
              <Stat
                label="Acceptance"
                value={item.acceptanceRate === null ? '—' : `${Math.round(item.acceptanceRate * 100)}%`}
              />
              <Stat label="Times fired" value={item.fired.toString()} />
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {item.note}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-3xl font-semibold text-slate-950 mt-2">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

function DoctrineCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="font-semibold text-white">{title}</p>
      <p className="text-sm text-slate-300 mt-2">{body}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-slate-950 mt-1">{value}</p>
    </div>
  );
}
