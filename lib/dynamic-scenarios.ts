import { SCENARIOS } from './scenarios';
import type {
  NewnalUserProfile,
  RecentProposalSummary,
  ScenarioResultTriggered,
  ScenarioType,
} from './types';
import { hasWaveSpeed, waveSpeedJson } from './wavespeed';

interface DynamicScenarioInput {
  profile: NewnalUserProfile;
  triggered: ScenarioResultTriggered[];
  recentUserProposals: RecentProposalSummary[];
}

interface RawDynamicScenario {
  id_slug?: string;
  name?: string;
  type?: ScenarioType;
  confidence?: number;
  evidencePoints?: string[];
  proposalContext?: Record<string, unknown>;
}

interface DynamicScenarioResponse {
  scenarios?: RawDynamicScenario[];
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function slugToScenarioId(slug: string) {
  return `WS_${slug
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)}`;
}

function compactProfile(profile: NewnalUserProfile) {
  return {
    id: profile.id,
    displayName: profile.displayName,
    age: profile.profileSnapshot.age,
    location: profile.profileSnapshot.location,
    persona: profile.profileSnapshot.persona,
    goal: profile.profileSnapshot.goal,
    completeness: profile.profileSnapshot.completeness,
    spending: {
      topCategories: profile.spending.topCategories.slice(0, 4),
      subscriptions: profile.spending.subscriptions.slice(0, 6).map((sub) => ({
        name: sub.name,
        category: sub.category,
        monthlyCost: sub.monthlyCost,
        usageFrequency: sub.usageFrequency,
        lastUsed: sub.lastUsed,
      })),
      recentPurchases: profile.spending.purchaseHistory.slice(0, 8).map((purchase) => ({
        category: purchase.category,
        merchant: purchase.merchant,
        amount: purchase.amount,
        date: purchase.date,
        usageAfterPurchase: purchase.usageAfterPurchase,
        returnedOrCancelled: purchase.returnedOrCancelled,
      })),
    },
    health: {
      fitnessGoals: profile.health.fitnessGoals,
      stepsPerDay: profile.health.stepsPerDay,
      sleepAverage: profile.health.sleepAverage,
      gymMemberships: profile.health.gymMemberships.slice(0, 5),
    },
    nearbyPlaces: (profile.schedules.nearbyPlaces ?? []).slice(0, 8),
    restaurants: profile.taste.restaurantHistory.slice(0, 6),
    socialRatings: profile.taste.socialCircleRatings.slice(0, 6),
    phoneSearches: profile.phoneActivity.searchHistory.slice(0, 8),
    savedItems: profile.phoneActivity.savedItems.slice(0, 5),
    values: profile.values,
    character: profile.character,
  };
}

function normalizeScenario(raw: RawDynamicScenario): ScenarioResultTriggered | null {
  if (!raw.id_slug || !raw.name || !raw.type || !Array.isArray(raw.evidencePoints)) {
    return null;
  }
  if (raw.type !== 'warning' && raw.type !== 'nudge') return null;

  const evidencePoints = raw.evidencePoints
    .map((point) => String(point).trim())
    .filter(Boolean)
    .slice(0, 4);

  if (evidencePoints.length === 0) return null;

  return {
    triggered: true,
    scenarioId: slugToScenarioId(raw.id_slug),
    scenarioName: raw.name.trim().slice(0, 60),
    scenarioType: raw.type,
    confidence: clamp(Number(raw.confidence ?? 0.6), 0.45, 0.93),
    evidencePoints,
    proposalContext: {
      ...(raw.proposalContext ?? {}),
      generatedBy: 'wavespeed',
    },
  };
}

export async function generateDynamicScenarios({
  profile,
  triggered,
  recentUserProposals,
}: DynamicScenarioInput): Promise<ScenarioResultTriggered[]> {
  if (!hasWaveSpeed()) return [];

  const coreScenarioGlossary = SCENARIOS.map((scenario) => ({
    id: scenario.id,
    name: scenario.name,
    type: scenario.type,
    description: scenario.longDescription,
  }));

  const prompt = `You are inventing additional high-signal intervention scenarios for a decision-moment consumer agent.

You may return 0, 1, or 2 extra scenarios.

Rules:
- Only use the supplied user data. Do not imagine hidden facts.
- Each scenario must be materially different from the fixed core scenarios and different from already-triggered scenarios.
- Favor concrete, near-term, non-obvious interventions tied to behavior patterns, nearby context, timing, or repeated intent.
- Only output scenarios that would be useful enough to interrupt a user.
- Warnings should protect against a likely mistake.
- Nudges should help a user follow through on a real intention.
- Keep confidence between 0.45 and 0.93.
- evidencePoints must be specific facts from the payload.
- proposalContext must stay small and JSON-safe.

Return only JSON:
{
  "scenarios": [
    {
      "id_slug": "short_slug",
      "name": "Short scenario name",
      "type": "warning" | "nudge",
      "confidence": 0.0,
      "evidencePoints": ["fact 1", "fact 2"],
      "proposalContext": { "optional": "data" }
    }
  ]
}

Fixed core scenarios:
${JSON.stringify(coreScenarioGlossary)}

Already-triggered scenarios:
${JSON.stringify(triggered.map((scenario) => ({
  id: scenario.scenarioId,
  name: scenario.scenarioName,
  type: scenario.scenarioType,
  evidencePoints: scenario.evidencePoints,
})))}

Recent proposals:
${JSON.stringify(recentUserProposals)}

User profile:
${JSON.stringify(compactProfile(profile))}`;

  try {
    const response = await waveSpeedJson<DynamicScenarioResponse>({
      system: 'You are a precise product-policy model that emits only valid JSON.',
      prompt,
      temperature: 0.45,
      maxTokens: 1800,
    });

    const existingIds = new Set(triggered.map((scenario) => scenario.scenarioId));
    const existingNames = new Set(triggered.map((scenario) => scenario.scenarioName.toLowerCase()));

    return (response.scenarios ?? [])
      .map(normalizeScenario)
      .filter((scenario): scenario is ScenarioResultTriggered => Boolean(scenario))
      .filter((scenario) => !existingIds.has(scenario.scenarioId))
      .filter((scenario) => !existingNames.has(scenario.scenarioName.toLowerCase()))
      .slice(0, 2);
  } catch (error) {
    console.warn('WaveSpeed dynamic scenario generation failed:', error);
    return [];
  }
}
