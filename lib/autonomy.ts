import type {
  AutonomyCandidate,
  AutonomyDecision,
  NewnalUserProfile,
  RecentProposalSummary,
  ScenarioPerformanceSnapshot,
  ScenarioResultTriggered,
  ScenarioType,
} from './types';

interface BuildAutonomyInput {
  profile: NewnalUserProfile;
  triggered: ScenarioResultTriggered[];
  recentUserProposals: RecentProposalSummary[];
  performanceByScenario: Record<string, ScenarioPerformanceSnapshot>;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function defaultAcceptanceRate(type: ScenarioType) {
  return type === 'warning' ? 0.41 : 0.48;
}

export function deriveAdaptiveFloor(
  type: ScenarioType,
  performance?: ScenarioPerformanceSnapshot,
): number {
  const base = type === 'warning' ? 0.56 : 0.6;
  if (!performance || performance.fired === 0 || performance.acceptanceRate === null) {
    return base;
  }

  const sampleStrength = clamp(performance.fired / 12, 0, 1);
  const rateDelta = 0.5 - performance.acceptanceRate;
  const volumePenalty =
    performance.fired >= 8 && performance.acceptanceRate < 0.25 ? 0.05 : 0;

  return clamp(base + rateDelta * 0.2 * sampleStrength + volumePenalty, 0.42, 0.84);
}

function getDistanceMeters(result: ScenarioResultTriggered): number | undefined {
  const ctx = result.proposalContext as Record<string, unknown>;
  const directKeys = ['betterDistance'] as const;
  for (const key of directKeys) {
    const value = ctx[key];
    if (typeof value === 'number') return value;
  }

  const nestedKeys = ['place', 'store', 'gym', 'current'] as const;
  for (const key of nestedKeys) {
    const value = ctx[key];
    if (value && typeof value === 'object' && typeof (value as { distance?: unknown }).distance === 'number') {
      return (value as { distance: number }).distance;
    }
  }
  return undefined;
}

function deriveTimingScore(result: ScenarioResultTriggered): number {
  const distance = getDistanceMeters(result);
  if (typeof distance === 'number') {
    if (distance <= 120) return 0.96;
    if (distance <= 250) return 0.9;
    if (distance <= 500) return 0.78;
    if (distance <= 900) return 0.64;
    return 0.5;
  }

  const ctx = result.proposalContext as Record<string, unknown>;
  if (typeof ctx.daysAgo === 'number') {
    const daysAgo = ctx.daysAgo;
    if (daysAgo <= 60) return 0.82;
    if (daysAgo <= 120) return 0.72;
    return 0.6;
  }
  if (typeof ctx.monthsSince === 'number' || typeof ctx.monthsOld === 'number') {
    return 0.68;
  }
  return 0.62;
}

function deriveBehaviorFit(
  profile: NewnalUserProfile,
  result: ScenarioResultTriggered,
): number {
  const growth = clamp(profile.values.growthOrientation ?? 0.5);
  const community = clamp(profile.values.communityOrientation ?? 0.5);
  const completeness = clamp(profile.profileSnapshot.completeness ?? 0.5);

  if (result.scenarioType === 'warning') {
    return clamp(0.45 + growth * 0.35 + completeness * 0.1, 0.35, 0.95);
  }
  return clamp(0.42 + community * 0.18 + growth * 0.18 + completeness * 0.12, 0.35, 0.95);
}

function deriveFatiguePenalty(
  result: ScenarioResultTriggered,
  recentUserProposals: RecentProposalSummary[],
): number {
  const now = Date.now();
  let penalty = 0;

  for (const proposal of recentUserProposals) {
    const ageDays = (now - new Date(proposal.sentAt).getTime()) / 86_400_000;
    if (ageDays > 14) continue;

    if (ageDays < 1) penalty += 0.22;
    else if (ageDays < 3) penalty += 0.14;
    else penalty += 0.06;

    if (proposal.scenarioId === result.scenarioId) penalty += 0.12;
    if (proposal.accepted === false) penalty += 0.05;
  }

  return clamp(penalty, 0, 0.55);
}

function creativeDirection(
  profile: NewnalUserProfile,
  result: ScenarioResultTriggered,
): string {
  const firstName = profile.displayName.split(' ')[0] ?? profile.displayName;
  if (result.scenarioType === 'warning') {
    return `${firstName}-specific protective note: lead with one sharp regret datapoint, then end on a pause-inducing question.`;
  }
  return `${firstName}-specific momentum nudge: concrete, optimistic, and anchored to what is nearby right now.`;
}

function buildReasons(
  result: ScenarioResultTriggered,
  sendScore: number,
  adaptiveFloor: number,
  acceptancePrediction: number,
  fatiguePenalty: number,
  historicalAcceptance: number | null,
): string[] {
  const reasons = [
    `${Math.round(result.confidence * 100)}% evidence strength from the rule engine`,
    `AI send score ${Math.round(sendScore * 100)} vs adaptive floor ${Math.round(adaptiveFloor * 100)}`,
    `${Math.round(acceptancePrediction * 100)}% predicted acceptance if sent now`,
  ];

  if (historicalAcceptance !== null) {
    reasons.push(`${Math.round(historicalAcceptance * 100)}% historical acceptance on this scenario`);
  } else {
    reasons.push('Cold-start scenario: using global priors until the model sees outcomes');
  }

  if (fatiguePenalty > 0.18) {
    reasons.push('Recent proposal fatigue is suppressing aggressiveness');
  }

  return reasons;
}

function buildHeuristicDecision(
  input: BuildAutonomyInput,
): AutonomyDecision {
  const isDemoProfile = input.profile.id.startsWith('demo:');
  const candidates: AutonomyCandidate[] = input.triggered.map((result) => {
    const performance = isDemoProfile
      ? undefined
      : input.performanceByScenario[result.scenarioId];
    const historicalAcceptance = performance?.acceptanceRate ?? null;
    const adaptiveFloor = deriveAdaptiveFloor(result.scenarioType, performance);
    const timingScore = deriveTimingScore(result);
    const behaviorFit = deriveBehaviorFit(input.profile, result);
    const fatiguePenalty = isDemoProfile
      ? 0
      : deriveFatiguePenalty(result, input.recentUserProposals);
    const history = historicalAcceptance ?? defaultAcceptanceRate(result.scenarioType);
    const noveltyBoost = input.recentUserProposals.some((p) => p.scenarioId === result.scenarioId)
      ? 0
      : 0.04;
    const demoBoost = isDemoProfile ? 0.18 : 0;

    const sendScore = clamp(
      result.confidence * 0.38
        + timingScore * 0.24
        + behaviorFit * 0.14
        + history * 0.18
        + noveltyBoost
        + demoBoost
        - fatiguePenalty,
      0,
      1,
    );

    const acceptancePrediction = clamp(
      sendScore * 0.58
        + history * 0.22
        + clamp(input.profile.profileSnapshot.completeness) * 0.2,
      0.08,
      0.94,
    );

    let posture: AutonomyCandidate['posture'] = 'hold';
    if (sendScore >= adaptiveFloor) posture = 'send_now';
    else if (sendScore >= adaptiveFloor - 0.08) posture = 'watch';

    return {
      scenarioId: result.scenarioId,
      scenarioName: result.scenarioName,
      scenarioType: result.scenarioType,
      posture,
      confidence: result.confidence,
      sendScore,
      adaptiveFloor,
      acceptancePrediction,
      timingScore,
      fatiguePenalty,
      behaviorFit,
      historicalAcceptance,
      creativeDirection: creativeDirection(input.profile, result),
      reasons: buildReasons(
        result,
        sendScore,
        adaptiveFloor,
        acceptancePrediction,
        fatiguePenalty,
        historicalAcceptance,
      ),
    };
  }).sort((a, b) => b.sendScore - a.sendScore);

  if (candidates.length === 0) {
    return {
      policyModel: 'embedded-autonomy-v1',
      operatorInvolvement: 'none',
      recommendedAction: 'hold',
      summaryHeadline: 'No proposal is worth interrupting with right now.',
      summaryBody: 'The model saw no scenario strong enough to justify a send.',
      narrative: [
        'No rule crossed the activation bar.',
        'Autopilot prefers silence over weak advice.',
      ],
      candidates: [],
    };
  }

  const primary = candidates[0];
  const sendable = candidates.find((candidate) => candidate.posture === 'send_now');
  const recommendedAction = sendable ? 'send_now' : 'hold';
  const chosen = sendable ?? primary;

  return {
    policyModel: 'embedded-autonomy-v1',
    operatorInvolvement: 'none',
    recommendedAction,
    primaryScenarioId: sendable?.scenarioId,
    summaryHeadline:
      recommendedAction === 'send_now'
        ? `Autopilot wants to fire ${chosen.scenarioName} now.`
        : `Autopilot is holding ${chosen.scenarioName} for a cleaner moment.`,
    summaryBody:
      recommendedAction === 'send_now'
        ? `The combination of evidence, timing, and predicted acceptance beats the model-owned floor.`
        : `The evidence is real, but the timing or fatigue signal does not justify an interruption yet.`,
    narrative: [
      `${Math.round(chosen.sendScore * 100)} send score against a ${Math.round(chosen.adaptiveFloor * 100)} adaptive floor`,
      `${Math.round(chosen.acceptancePrediction * 100)}% predicted acceptance if sent now`,
      chosen.creativeDirection,
    ],
    candidates,
  };
}

async function reviewWithClaude(
  profile: NewnalUserProfile,
  heuristic: AutonomyDecision,
): Promise<AutonomyDecision | null> {
  if (!process.env.ANTHROPIC_API_KEY || heuristic.candidates.length === 0) {
    return null;
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic();
    const prompt = `You are the autonomous policy layer for a decision-moment consumer agent.

User:
- name: ${profile.displayName}
- age: ${profile.profileSnapshot.age}
- location: ${profile.profileSnapshot.location}
- persona: ${profile.profileSnapshot.persona}
- goal: ${profile.profileSnapshot.goal}

Heuristic recommendation:
${JSON.stringify(heuristic, null, 2)}

Task:
Choose whether the agent should SEND_NOW or HOLD.
If sending, select exactly one primaryScenarioId from the candidate list.
Be conservative about interrupting the user. Silence is better than a weak nudge.

Return only valid JSON:
{
  "recommendedAction": "send_now" | "hold",
  "primaryScenarioId": "optional scenario id if sending",
  "summaryHeadline": "short sentence",
  "summaryBody": "short explanation",
  "narrative": ["bullet 1", "bullet 2", "bullet 3"]
}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content[0];
    const text = block && block.type === 'text' ? block.text : '{}';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as {
      recommendedAction?: 'send_now' | 'hold';
      primaryScenarioId?: string;
      summaryHeadline?: string;
      summaryBody?: string;
      narrative?: string[];
    };

    const primaryCandidate = heuristic.candidates.find(
      (candidate) => candidate.scenarioId === parsed.primaryScenarioId,
    );

    return {
      ...heuristic,
      policyModel: 'claude-sonnet-4-20250514',
      recommendedAction:
        parsed.recommendedAction === 'send_now' && primaryCandidate ? 'send_now' : 'hold',
      primaryScenarioId:
        parsed.recommendedAction === 'send_now' && primaryCandidate
          ? parsed.primaryScenarioId
          : undefined,
      summaryHeadline: parsed.summaryHeadline || heuristic.summaryHeadline,
      summaryBody: parsed.summaryBody || heuristic.summaryBody,
      narrative:
        parsed.narrative && parsed.narrative.length > 0
          ? parsed.narrative.slice(0, 3)
          : heuristic.narrative,
    };
  } catch (error) {
    console.warn('Claude autonomy review failed, falling back to heuristic policy:', error);
    return null;
  }
}

export async function buildAutonomyDecision(
  input: BuildAutonomyInput,
): Promise<AutonomyDecision> {
  const heuristic = buildHeuristicDecision(input);
  const reviewed = await reviewWithClaude(input.profile, heuristic);
  return reviewed ?? heuristic;
}
