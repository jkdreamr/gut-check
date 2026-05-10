// app/api/scenarios/route.ts — read-only AI governance telemetry.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SCENARIOS, SCENARIO_META_BY_ID, isGeneratedScenarioId } from '@/lib/scenarios';
import { deriveAdaptiveFloor } from '@/lib/autonomy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [counts, accepts, seenScenarios] = await Promise.all([
    prisma.proposalLog.groupBy({
      by: ['scenarioId'],
      _count: { _all: true },
    }),
    prisma.proposalLog.groupBy({
      by: ['scenarioId'],
      where: { accepted: true },
      _count: { _all: true },
    }),
    prisma.proposalLog.findMany({
      select: {
        scenarioId: true,
        scenarioName: true,
        scenarioType: true,
      },
      distinct: ['scenarioId'],
      orderBy: { sentAt: 'desc' },
    }),
  ]);

  const countById = Object.fromEntries(counts.map((row) => [row.scenarioId, row._count._all]));
  const acceptById = Object.fromEntries(accepts.map((row) => [row.scenarioId, row._count._all]));

  const generatedScenarios = seenScenarios
    .filter((scenario) => !SCENARIO_META_BY_ID[scenario.scenarioId] && isGeneratedScenarioId(scenario.scenarioId))
    .map((scenario) => ({
      id: scenario.scenarioId,
      name: scenario.scenarioName,
      type: scenario.scenarioType as 'warning' | 'nudge',
      shortDescription: 'WaveSpeed-generated live scenario',
      longDescription: 'Synthesized from the user profile and prior outcomes at runtime by the WaveSpeed model layer.',
    }));

  return NextResponse.json({
    autonomous: true,
    scenarios: [...SCENARIOS, ...generatedScenarios].map((scenario) => {
      const fired = countById[scenario.id] ?? 0;
      const accepted = acceptById[scenario.id] ?? 0;
      const acceptanceRate = fired > 0 ? accepted / fired : null;
      return {
        ...scenario,
        fired,
        accepted,
        acceptanceRate,
        adaptiveFloor: deriveAdaptiveFloor(scenario.type, {
          fired,
          accepted,
          acceptanceRate,
        }),
      };
    }),
  });
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Manual scenario tuning has been retired. The autonomous policy layer now owns thresholds and dispatch posture.',
    },
    { status: 403 },
  );
}
