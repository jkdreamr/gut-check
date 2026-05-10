import 'server-only';

import { runAllScenarios } from './rule-engine';
import { ALL_SCENARIO_IDS } from './scenarios';
import type {
  DecisionMoment,
  NewnalUserProfile,
  ScenarioResultTriggered,
} from './types';

const now = () => new Date().toISOString();

export const CURATED_DEMO_MOMENTS: DecisionMoment[] = [
  {
    id: 'moment-gym-swipe',
    kind: 'payment',
    title: 'About to pay for another gym membership',
    description: 'A demo payment intent signal shows a fresh recurring charge right before signup.',
    userId: 'demo:alex',
    source: 'demo',
    timestamp: now(),
    policyIntent: 'protect',
    transaction: {
      merchantName: 'Crunch Fitness',
      amount: 79,
      currency: 'USD',
      category: 'gym',
      status: 'pending',
      source: 'demo',
      note: 'Monthly membership checkout detected before card swipe.',
    },
    location: {
      placeName: 'Crunch Fitness · SoMa',
      latitude: 37.7819,
      longitude: -122.4056,
      distanceMeters: 180,
      source: 'demo',
      permission: 'synthetic',
    },
    signalSummary: ['Demo payment intent', 'Nearby gym', 'Two short-lived memberships in history'],
    likelyScenarioIds: ['W1_GHOST_GYM'],
  },
  {
    id: 'moment-friend-warning',
    kind: 'restaurant',
    title: 'Near a restaurant friends disliked',
    description: 'Location signal lines up with a place the user’s own circle rated badly.',
    userId: 'demo:jordan',
    source: 'demo',
    timestamp: now(),
    policyIntent: 'protect',
    location: {
      placeName: 'Tava Indian Kitchen',
      latitude: 37.4454,
      longitude: -122.1619,
      distanceMeters: 110,
      source: 'demo',
      permission: 'synthetic',
    },
    signalSummary: ['Nearby restaurant', 'Friend ratings under 3.0', 'Dinner decision right now'],
    likelyScenarioIds: ['W4_FRIEND_WARNING', 'W5_BETTER_RESTAURANT'],
  },
  {
    id: 'moment-dormant-goal',
    kind: 'health',
    title: 'Near a place that matches a dormant goal',
    description: 'A stored search and a nearby store line up with a goal the user has not followed through on.',
    userId: 'demo:sam',
    source: 'demo',
    timestamp: now(),
    policyIntent: 'nudge',
    location: {
      placeName: 'Fleet Feet',
      latitude: 37.4523,
      longitude: -122.1817,
      distanceMeters: 220,
      source: 'demo',
      permission: 'synthetic',
    },
    transaction: {
      merchantName: 'Fleet Feet',
      amount: 165,
      currency: 'USD',
      category: 'footwear',
      status: 'pending',
      source: 'demo',
      note: 'Demo purchase decision detected near running gear checkout.',
    },
    signalSummary: ['Dormant search', 'Running goal', 'Store nearby'],
    likelyScenarioIds: ['P2_DORMANT_INTEREST', 'P4_HEALTH_GOAL'],
  },
  {
    id: 'moment-repeat-regret',
    kind: 'payment',
    title: 'About to buy a product they usually regret',
    description: 'A demo checkout signal matches a pattern of returned or abandoned purchases in the same category.',
    userId: 'demo:maya',
    source: 'demo',
    timestamp: now(),
    policyIntent: 'protect',
    transaction: {
      merchantName: 'Apple Store',
      amount: 329,
      currency: 'USD',
      category: 'electronics',
      status: 'pending',
      source: 'demo',
      note: 'Demo checkout signal triggered for another audio accessory purchase.',
    },
    location: {
      placeName: 'Apple Store',
      latitude: 37.7857,
      longitude: -122.4061,
      distanceMeters: 90,
      source: 'demo',
      permission: 'synthetic',
    },
    signalSummary: ['Payment moment', 'Repeated abandoned category', 'Nearby electronics store'],
    likelyScenarioIds: ['W3_REPEAT_REGRET', 'W6_SIMILAR_DISAPPOINTMENT'],
  },
  {
    id: 'moment-subscription-bleed',
    kind: 'subscription',
    title: 'Unused subscriptions quietly draining money',
    description: 'A renewal moment surfaces recurring charges that have gone stale for weeks.',
    userId: 'demo:leo',
    source: 'demo',
    timestamp: now(),
    policyIntent: 'protect',
    transaction: {
      merchantName: 'Multiple renewals',
      amount: 58,
      currency: 'USD',
      category: 'subscription',
      status: 'pending',
      source: 'demo',
      note: 'Demo renewal bundle detected across three underused subscriptions.',
    },
    signalSummary: ['Recurring charges today', 'Three stale subscriptions', 'No recent usage'],
    likelyScenarioIds: ['W2_GHOST_SUBSCRIPTION'],
  },
];

function inferredLocationSignal(
  placeName: string,
  distanceMeters: number | undefined,
): DecisionMoment['location'] {
  return {
    placeName,
    distanceMeters,
    source: 'synthetic',
    permission: 'synthetic',
  };
}

function paymentMoment(
  userId: string,
  title: string,
  description: string,
  transaction: DecisionMoment['transaction'],
  location?: DecisionMoment['location'],
  likelyScenarioIds?: string[],
  signalSummary?: string[],
  policyIntent: DecisionMoment['policyIntent'] = 'protect',
): DecisionMoment {
  return {
    id: `${userId}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    kind: transaction?.category === 'subscription' ? 'subscription' : 'payment',
    title,
    description,
    userId,
    source: 'synthetic',
    timestamp: now(),
    transaction,
    location,
    likelyScenarioIds,
    signalSummary,
    policyIntent,
  };
}

function mapScenarioToMoment(
  profile: NewnalUserProfile,
  scenario: ScenarioResultTriggered,
): DecisionMoment | null {
  const ctx = scenario.proposalContext as Record<string, unknown>;

  switch (scenario.scenarioId) {
    case 'W1_GHOST_GYM': {
      const nearbyGym = String(ctx.nearbyGym ?? 'Nearby gym');
      return paymentMoment(
        profile.id,
        'Membership checkout detected',
        'A gym signup moment lines up with a short-lived membership pattern.',
        {
          merchantName: nearbyGym,
          amount: 79,
          currency: 'USD',
          category: 'gym',
          status: 'pending',
          source: 'inferred',
          note: 'Inferred from nearby gym context and repeat cancellation history.',
        },
        inferredLocationSignal(nearbyGym, Number((ctx as { betterDistance?: number }).betterDistance) || 180),
        [scenario.scenarioId],
        scenario.evidencePoints,
      );
    }
    case 'W2_GHOST_SUBSCRIPTION': {
      const worst = ctx.worst as { name?: string } | undefined;
      const monthlyWaste = Number(ctx.monthlyWaste ?? 0);
      return paymentMoment(
        profile.id,
        'Renewal drift detected',
        'Recurring charges are about to roll over even though usage has gone quiet.',
        {
          merchantName: worst?.name ?? 'Subscription renewal',
          amount: monthlyWaste,
          currency: 'USD',
          category: 'subscription',
          status: 'pending',
          source: 'inferred',
        },
        undefined,
        [scenario.scenarioId],
        scenario.evidencePoints,
      );
    }
    case 'W3_REPEAT_REGRET':
    case 'W6_SIMILAR_DISAPPOINTMENT': {
      const category = String(ctx.category ?? 'this category');
      const store = profile.schedules.nearbyPlaces?.find((place) => place.category === category || place.type === category);
      return paymentMoment(
        profile.id,
        'Purchase decision detected',
        'A likely checkout moment matches a category with poor follow-through.',
        {
          merchantName: store?.name ?? 'Nearby store',
          amount: 219,
          currency: 'USD',
          category,
          status: 'pending',
          source: 'inferred',
        },
        inferredLocationSignal(store?.name ?? 'Nearby store', store?.distance),
        [scenario.scenarioId],
        scenario.evidencePoints,
      );
    }
    case 'W4_FRIEND_WARNING':
    case 'W5_BETTER_RESTAURANT': {
      const place = (ctx.place ?? ctx.current) as { name?: string; distance?: number } | undefined;
      return {
        id: `${profile.id}-${scenario.scenarioId.toLowerCase()}`,
        kind: 'restaurant',
        title: 'Dinner decision detected',
        description: 'Location and social context suggest the next choice is happening right now.',
        userId: profile.id,
        source: 'synthetic',
        timestamp: now(),
        location: inferredLocationSignal(place?.name ?? 'Nearby restaurant', place?.distance),
        likelyScenarioIds: [scenario.scenarioId],
        signalSummary: scenario.evidencePoints,
        policyIntent: 'protect',
      };
    }
    case 'P2_DORMANT_INTEREST':
    case 'P3_NEW_VERSION':
    case 'P4_HEALTH_GOAL': {
      const store = (ctx.store ?? ctx.gym) as { name?: string; distance?: number } | undefined;
      const category =
        scenario.scenarioId === 'P4_HEALTH_GOAL'
          ? 'health'
          : scenario.scenarioId === 'P3_NEW_VERSION'
          ? 'electronics'
          : 'goal';
      return {
        id: `${profile.id}-${scenario.scenarioId.toLowerCase()}`,
        kind: scenario.scenarioId === 'P4_HEALTH_GOAL' ? 'health' : 'location',
        title: 'Decision moment detected',
        description: 'A nearby place lines up with a goal or interest the user already showed.',
        userId: profile.id,
        source: 'synthetic',
        timestamp: now(),
        transaction:
          scenario.scenarioId === 'P4_HEALTH_GOAL'
            ? undefined
            : {
                merchantName: store?.name ?? 'Nearby store',
                amount: scenario.scenarioId === 'P3_NEW_VERSION' ? 399 : 165,
                currency: 'USD',
                category,
                status: 'pending',
                source: 'inferred',
              },
        location: inferredLocationSignal(store?.name ?? 'Nearby place', store?.distance),
        likelyScenarioIds: [scenario.scenarioId],
        signalSummary: scenario.evidencePoints,
        policyIntent: 'nudge',
      };
    }
    case 'P5_LOYAL_SPOT': {
      const place = ctx.place as { name?: string; distance?: number } | undefined;
      return {
        id: `${profile.id}-${scenario.scenarioId.toLowerCase()}`,
        kind: 'restaurant',
        title: 'A familiar place is nearby again',
        description: 'Context suggests a low-pressure nudge could reconnect the user with something they already love.',
        userId: profile.id,
        source: 'synthetic',
        timestamp: now(),
        location: inferredLocationSignal(place?.name ?? 'Favorite spot', Number(ctx.distance ?? place?.distance)),
        likelyScenarioIds: [scenario.scenarioId],
        signalSummary: scenario.evidencePoints,
        policyIntent: 'nudge',
      };
    }
    default:
      return null;
  }
}

export function deriveLikelyDecisionMoments(profile: NewnalUserProfile): DecisionMoment[] {
  if (profile.id.startsWith('demo:')) {
    const curated = CURATED_DEMO_MOMENTS.filter((moment) => moment.userId === profile.id);
    if (curated.length > 0) return curated;
  }

  const triggered = runAllScenarios(profile, ALL_SCENARIO_IDS).filter(
    (result): result is ScenarioResultTriggered => result.triggered === true,
  );

  const moments = triggered
    .map((scenario) => mapScenarioToMoment(profile, scenario))
    .filter((moment): moment is DecisionMoment => Boolean(moment));

  if (moments.length > 0) return moments.slice(0, 4);

  return [
    {
      id: `${profile.id}-context-scan`,
      kind: 'custom',
      title: 'Context scan ready',
      description: 'The agent is watching for the next moment where history, context, and timing line up.',
      userId: profile.id,
      source: profile.id.startsWith('demo:') ? 'demo' : 'synthetic',
      timestamp: now(),
      signalSummary: [
        `${Math.round(profile.profileSnapshot.completeness * 100)}% profile completeness`,
        `${profile.spending.subscriptions.length} subscriptions mapped`,
        `${profile.phoneActivity.searchHistory.length} search signals available`,
      ],
      policyIntent: 'nudge',
    },
  ];
}

export function getDecisionMomentForUser(userId: string, momentId?: string) {
  const moments = CURATED_DEMO_MOMENTS.filter((moment) => moment.userId === userId);
  if (!momentId) return moments[0];
  return moments.find((moment) => moment.id === momentId) ?? moments[0];
}
