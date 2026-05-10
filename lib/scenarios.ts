// lib/scenarios.ts — registry of all 11 Gut Check scenarios.
// Centralised so dashboard, scenarios page, and rule engine all stay in sync.

import type { ScenarioType } from './types';

export interface ScenarioMeta {
  id: string;
  name: string;
  type: ScenarioType;
  shortDescription: string;
  longDescription: string;
}

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: 'W1_GHOST_GYM',
    name: 'Ghost Gym',
    type: 'warning',
    shortDescription: "You've joined and quietly cancelled gyms before.",
    longDescription:
      'User is currently near a gym and has 2+ past gym memberships, each cancelled within 90 days. Warns before they sign up again.',
  },
  {
    id: 'W2_GHOST_SUBSCRIPTION',
    name: 'Ghost Subscription',
    type: 'warning',
    shortDescription: 'You already pay for things you never open.',
    longDescription:
      'Three or more active subscriptions have barely been used in 30+ days. Surfaces the quiet monthly bleed before another renewal or upsell.',
  },
  {
    id: 'W3_REPEAT_REGRET',
    name: 'Repeat Regret',
    type: 'warning',
    shortDescription: "You've bought this kind of thing and stopped using it.",
    longDescription:
      '3+ purchases in the same category, more than half abandoned or underused. The pattern itself is the warning.',
  },
  {
    id: 'W4_FRIEND_WARNING',
    name: 'Friend Warning',
    type: 'warning',
    shortDescription: 'Your circle does not vouch for this place.',
    longDescription:
      "User is near a restaurant or venue 3+ people in their social circle rated below 3.0/5.",
  },
  {
    id: 'W5_BETTER_RESTAURANT',
    name: 'Better Restaurant Nearby',
    type: 'warning',
    shortDescription: 'A spot you always come back to is right around the corner.',
    longDescription:
      'A second nearby restaurant in the same cuisine has a much higher personal return rate. Surface it before the user commits.',
  },
  {
    id: 'W6_SIMILAR_DISAPPOINTMENT',
    name: 'Similar Disappointment',
    type: 'warning',
    shortDescription: 'The last few of these you returned.',
    longDescription:
      "Two or more similar past purchases were returned or barely used. We'd hate for you to repeat the same mistake.",
  },
  {
    id: 'P1_SEASONAL_GAP',
    name: 'Seasonal Gap',
    type: 'nudge',
    shortDescription: 'It has been a long time since you bought for this season.',
    longDescription:
      "It's a particular season, you haven't purchased relevant seasonal items in 18+ months, and you're near a relevant store.",
  },
  {
    id: 'P2_DORMANT_INTEREST',
    name: 'Dormant Interest Activated',
    type: 'nudge',
    shortDescription: 'You researched this and never followed through.',
    longDescription:
      'User searched/saved a category 30–180 days ago, never bought, and is now near a store that sells it.',
  },
  {
    id: 'P3_NEW_VERSION',
    name: 'New Version Available',
    type: 'nudge',
    shortDescription: 'The device you bought is overdue for an upgrade.',
    longDescription:
      'A tracked tech/electronics purchase is 18+ months old and the user is near an electronics store.',
  },
  {
    id: 'P4_HEALTH_GOAL',
    name: 'Health Goal Alignment',
    type: 'nudge',
    shortDescription: 'Your stated goals match this place — and now is the moment.',
    longDescription:
      "User has stated fitness goals, current activity is below target, a relevant gym is nearby, and they don't have a Ghost Gym pattern.",
  },
  {
    id: 'P5_LOYAL_SPOT',
    name: 'Loyal Spot Reminder',
    type: 'nudge',
    shortDescription: "You haven't been to your favorite place in a while.",
    longDescription:
      "User used to visit a place 5+ times with high return rate, but hasn't in 60+ days, and is currently nearby.",
  },
];

export const ALL_SCENARIO_IDS = SCENARIOS.map((s) => s.id);
export const SCENARIO_TYPE_BY_ID: Record<string, ScenarioType> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s.type]),
);

export const SCENARIO_META_BY_ID = Object.fromEntries(
  SCENARIOS.map((scenario) => [scenario.id, scenario]),
) as Record<string, ScenarioMeta>;

export function isGeneratedScenarioId(id: string) {
  return id.startsWith('WS_');
}
