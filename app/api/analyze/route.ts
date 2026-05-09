// app/api/analyze/route.ts — run the rule engine on one user.
//
// POST body: { userId: string, name?: string, enabledScenarios?: string[] }
// Returns: { user, results, topProposals }

import { NextResponse, type NextRequest } from 'next/server';
import { getPersonalAi } from '@/lib/newnal';
import { adaptUserDetail } from '@/lib/synthesize';
import { runAllScenarios } from '@/lib/rule-engine';
import { generateProposal } from '@/lib/proposal-generator';
import { ALL_SCENARIO_IDS } from '@/lib/scenarios';
import { MOCK_USERS_BY_ID } from '@/lib/mock-users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { userId?: string; name?: string; enabledScenarios?: string[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const userId = body.userId;
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const enabled = body.enabledScenarios && body.enabledScenarios.length > 0
    ? body.enabledScenarios
    : ALL_SCENARIO_IDS;

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

    const triggered = runAllScenarios(profile, enabled).filter((r) => r.triggered === true);
    const top = triggered.slice(0, 3);
    const topProposals = await Promise.all(
      top.map(async (scenario) => {
        const prop = await generateProposal(scenario, profile);
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
      results: triggered,
      topProposals,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
