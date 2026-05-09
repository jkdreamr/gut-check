// app/scenarios/page.tsx — toggle and tune scenarios.

import { TopBar } from '@/components/layout/TopBar';
import { ScenarioToggle } from '@/components/scenarios/ScenarioToggle';
import { prisma } from '@/lib/prisma';
import { SCENARIOS } from '@/lib/scenarios';

export const dynamic = 'force-dynamic';

export default async function ScenariosPage() {
  // Bootstrap any missing rows.
  const existing = await prisma.scenarioConfig.findMany();
  const existingIds = new Set(existing.map((c) => c.id));
  const missing = SCENARIOS.filter((s) => !existingIds.has(s.id));
  if (missing.length > 0) {
    await prisma.scenarioConfig.createMany({
      data: missing.map((s) => ({ id: s.id, name: s.name, type: s.type, enabled: true, threshold: 0.5 })),
    });
  }
  const configs = await prisma.scenarioConfig.findMany();
  const configById = Object.fromEntries(configs.map((c) => [c.id, c]));

  const counts = await prisma.proposalLog.groupBy({
    by: ['scenarioId'],
    _count: { _all: true },
  });
  const accepts = await prisma.proposalLog.groupBy({
    by: ['scenarioId'],
    where: { accepted: true },
    _count: { _all: true },
  });
  const countById = Object.fromEntries(counts.map((c) => [c.scenarioId, c._count._all]));
  const acceptById = Object.fromEntries(accepts.map((a) => [a.scenarioId, a._count._all]));

  const warnings = SCENARIOS.filter((s) => s.type === 'warning');
  const nudges = SCENARIOS.filter((s) => s.type === 'nudge');

  return (
    <main>
      <TopBar
        title="Scenarios"
        subtitle="The 11 rule-engine scenarios that drive proposal generation. Toggle and tune confidence thresholds."
      />
      <div className="px-8 py-8 space-y-8">
        <Group label="Warnings · don't do this again" items={warnings} configById={configById} countById={countById} acceptById={acceptById} />
        <Group label="Nudges · you should do this" items={nudges} configById={configById} countById={countById} acceptById={acceptById} />
      </div>
    </main>
  );
}

function Group({
  label, items, configById, countById, acceptById,
}: {
  label: string;
  items: typeof SCENARIOS;
  configById: Record<string, { enabled: boolean; threshold: number }>;
  countById: Record<string, number>;
  acceptById: Record<string, number>;
}) {
  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-wider text-gray-400 mb-3">{label}</h2>
      <div className="space-y-3">
        {items.map((s) => (
          <ScenarioToggle
            key={s.id}
            id={s.id}
            name={s.name}
            type={s.type}
            description={s.longDescription}
            enabled={configById[s.id]?.enabled ?? true}
            threshold={configById[s.id]?.threshold ?? 0.5}
            fired={countById[s.id] ?? 0}
            accepted={acceptById[s.id] ?? 0}
          />
        ))}
      </div>
    </section>
  );
}
