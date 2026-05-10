// app/api/analyze/route.ts — run the rule engine and autonomous policy layer.
//
// POST body: { userId: string, name?: string }
// Returns: { user, results, topProposals, autonomy }

import { NextResponse, type NextRequest } from 'next/server';
import { getPersonalAi } from '@/lib/newnal';
import { adaptUserDetail } from '@/lib/synthesize';
import { runAllScenarios } from '@/lib/rule-engine';
import { generateProposal, generateProposalSync } from '@/lib/proposal-generator';
import { ALL_SCENARIO_IDS } from '@/lib/scenarios';
import { MOCK_USERS_BY_ID } from '@/lib/mock-users';
import { buildAutonomyDecision } from '@/lib/autonomy';
import { explainDatabaseIssue } from '@/lib/database';
import { generateDynamicScenarios } from '@/lib/dynamic-scenarios';
import type {
  DecisionMoment,
  RecentProposalSummary,
  ScenarioPerformanceSnapshot,
} from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadProposalTelemetry(userId: string): Promise<{
  recentUserProposals: RecentProposalSummary[];
  performanceByScenario: Record<string, ScenarioPerformanceSnapshot>;
}> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const [recentUserLogs, counts, acceptCounts] = await Promise.all([
      prisma.proposalLog.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        take: 12,
      }),
      prisma.proposalLog.groupBy({
        by: ['scenarioId'],
        _count: { _all: true },
      }),
      prisma.proposalLog.groupBy({
        by: ['scenarioId'],
        where: { accepted: true },
        _count: { _all: true },
      }),
    ]);

    const acceptById = Object.fromEntries(
      acceptCounts.map((row) => [row.scenarioId, row._count._all]),
    );
    const performanceByScenario = Object.fromEntries(
      counts.map((row) => {
        const accepted = acceptById[row.scenarioId] ?? 0;
        const fired = row._count._all;
        return [
          row.scenarioId,
          {
            fired,
            accepted,
            acceptanceRate: fired > 0 ? accepted / fired : null,
          },
        ];
      }),
    );

    return {
      recentUserProposals: recentUserLogs.map((log) => ({
        scenarioId: log.scenarioId,
        scenarioType: log.scenarioType as 'warning' | 'nudge',
        sentAt: log.sentAt.toISOString(),
        accepted: log.accepted,
      })),
      performanceByScenario,
    };
  } catch (error) {
    console.warn(`Falling back to empty proposal telemetry for /api/analyze: ${explainDatabaseIssue(error)}`);
    return {
      recentUserProposals: [],
      performanceByScenario: {},
    };
  }
}

export async function POST(req: NextRequest) {
  let body: {
    userId?: string;
    name?: string;
    mode?: 'default';
    moment?: DecisionMoment;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const userId = body.userId;
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  try {
    let profile;
    if (userId.startsWith('demo:')) {
      profile = MOCK_USERS_BY_ID[userId];
      if (!profile) return NextResponse.json({ error: 'unknown demo user' }, { status: 404 });
    } else {
      const detail = await getPersonalAi(userId);
      profile = adaptUserDetail(
        { ai_did: userId, ai_name: body.name ?? 'Personal AI', match_score: 0 },
        detail,
      );
    }

    const telemetry = await loadProposalTelemetry(userId);

    const coreTriggered = runAllScenarios(profile, ALL_SCENARIO_IDS).filter((r) => r.triggered === true);
    const dynamicTriggered = await generateDynamicScenarios({
      profile,
      triggered: coreTriggered,
      recentUserProposals: telemetry.recentUserProposals,
      moment: body.moment,
    });
    const triggered = [...coreTriggered, ...dynamicTriggered];
    const autonomy = await buildAutonomyDecision({
      profile,
      triggered,
      recentUserProposals: telemetry.recentUserProposals,
      performanceByScenario: telemetry.performanceByScenario,
      moment: body.moment,
    });

    const topScenarioIds = autonomy.candidates.slice(0, 5).map((candidate) => candidate.scenarioId);
    const top = topScenarioIds
      .map((scenarioId) => triggered.find((scenario) => scenario.scenarioId === scenarioId))
      .filter((scenario): scenario is NonNullable<typeof scenario> => Boolean(scenario));

    const topProposals = await Promise.all(
      top.map(async (scenario) => {
        const useRichGeneration =
          scenario.scenarioId === autonomy.primaryScenarioId && !userId.startsWith('demo:');
        const prop = useRichGeneration
          ? await generateProposal(scenario, profile)
          : generateProposalSync(scenario, profile);
        return { scenario, headline: prop.headline, body: prop.body, source: prop.source };
      }),
    );
    return NextResponse.json({
      user: {
        id: profile.id,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        credibilityScore: profile.credibilityScore,
        profileSnapshot: profile.profileSnapshot,
        dataCompleteness: profile.dataCompleteness,
        personaProfile: profile.personaProfile,
      },
      decisionMoment: body.moment,
      results: triggered,
      topProposals,
      autonomy,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
