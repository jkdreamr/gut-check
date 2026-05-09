// lib/rule-engine.ts — all 11 Gut Check scenarios.
//
// Each scenario inspects a NewnalUserProfile (already adapted from the
// real Newnal API by lib/synthesize.ts) and returns either
// `{ triggered: false, ... }` or a triggered ScenarioResult with
// confidence + evidence + proposalContext for the LLM.

import { SCENARIOS } from './scenarios';
import type {
  NewnalUserProfile,
  ScenarioResult,
  ScenarioResultMissed,
  ScenarioResultTriggered,
} from './types';

function metaOf(id: string) {
  const m = SCENARIOS.find((s) => s.id === id);
  if (!m) throw new Error(`Unknown scenario id: ${id}`);
  return m;
}
function missed(id: string): ScenarioResultMissed {
  const meta = metaOf(id);
  return { triggered: false, scenarioId: id, scenarioName: meta.name, scenarioType: meta.type };
}
function triggered(
  id: string,
  confidence: number,
  evidencePoints: string[],
  proposalContext: Record<string, unknown>,
): ScenarioResultTriggered {
  const meta = metaOf(id);
  return {
    triggered: true,
    scenarioId: id,
    scenarioName: meta.name,
    scenarioType: meta.type,
    confidence: Math.max(0, Math.min(1, confidence)),
    evidencePoints,
    proposalContext,
  };
}

// ─── Warning scenarios ────────────────────────────────────────────────────

export function ghostGym(p: NewnalUserProfile): ScenarioResult {
  const nearby = (p.schedules.nearbyPlaces ?? []).filter((x) => x.type === 'gym');
  if (nearby.length === 0) return missed('W1_GHOST_GYM');
  const past = p.health.gymMemberships.filter(
    (g) => g.cancelledAfterDays !== undefined && g.cancelledAfterDays < 90,
  );
  if (past.length < 2) return missed('W1_GHOST_GYM');
  const avgDays = past.reduce((s, g) => s + (g.cancelledAfterDays ?? 0), 0) / past.length;
  return triggered(
    'W1_GHOST_GYM',
    Math.min(past.length / 3, 1),
    [
      `${past.length} gym memberships in your history`,
      `Average duration before cancellation: ${Math.round(avgDays)} days`,
      `${nearby[0].name} is ${nearby[0].distance}m away`,
    ],
    { avgDays, gymCount: past.length, nearbyGym: nearby[0].name },
  );
}

export function ghostSubscription(p: NewnalUserProfile): ScenarioResult {
  const ghosts = p.spending.subscriptions.filter(
    (s) => s.usageFrequency === 'rarely' || s.usageFrequency === 'never',
  );
  if (ghosts.length === 0) return missed('W2_GHOST_SUBSCRIPTION');
  const enriched = ghosts.map((s) => ({
    ...s,
    daysSince: Math.floor((Date.now() - new Date(s.lastUsed).getTime()) / 86_400_000),
  }));
  const stale = enriched.filter((s) => s.daysSince > 30);
  if (stale.length === 0) return missed('W2_GHOST_SUBSCRIPTION');
  const worst = stale.sort((a, b) => b.daysSince - a.daysSince)[0];
  const monthlyWaste = ghosts.reduce((s, g) => s + g.monthlyCost, 0);
  return triggered(
    'W2_GHOST_SUBSCRIPTION',
    0.85,
    [
      `"${worst.name}" — last used ${worst.daysSince} days ago, still $${worst.monthlyCost}/mo`,
      `${ghosts.length} subscriptions with almost no usage`,
      `Estimated monthly waste: $${monthlyWaste.toFixed(0)}`,
    ],
    { worst, ghostCount: ghosts.length, monthlyWaste },
  );
}

export function repeatRegret(p: NewnalUserProfile, nearbyCategory: string): ScenarioResult {
  if (!nearbyCategory) return missed('W3_REPEAT_REGRET');
  const cat = nearbyCategory.toLowerCase();
  const sameCat = p.spending.purchaseHistory.filter((x) => x.category.toLowerCase() === cat);
  if (sameCat.length < 3) return missed('W3_REPEAT_REGRET');
  const abandoned = sameCat.filter(
    (x) =>
      x.returnedOrCancelled || (x.usageAfterPurchase !== undefined && x.usageAfterPurchase < 0.3),
  );
  const rate = abandoned.length / sameCat.length;
  if (rate < 0.5) return missed('W3_REPEAT_REGRET');
  const avgUsage =
    abandoned.reduce((s, x) => s + (x.usageAfterPurchase ?? 0), 0) / Math.max(1, abandoned.length);
  return triggered(
    'W3_REPEAT_REGRET',
    rate,
    [
      `${sameCat.length} purchases in "${cat}" in the last 24 months`,
      `${Math.round(rate * 100)}% abandoned or underused`,
      `Average usage score: ${avgUsage.toFixed(2)}/1.0`,
    ],
    { category: cat, abandonRate: rate, count: sameCat.length },
  );
}

export function friendWarning(p: NewnalUserProfile): ScenarioResult {
  const nearby = p.schedules.nearbyPlaces ?? [];
  const ratings = p.taste.socialCircleRatings ?? [];
  for (const place of nearby) {
    const r = ratings.find((x) => x.placeName === place.name);
    if (r && r.avgFriendRating < 3.0 && r.friendCount >= 3) {
      return triggered(
        'W4_FRIEND_WARNING',
        1 - r.avgFriendRating / 5,
        [
          `"${place.name}" rated ${r.avgFriendRating.toFixed(1)}/5 by ${r.friendCount} people in your network`,
          `${place.distance}m from where you are`,
        ],
        { place, rating: r },
      );
    }
  }
  return missed('W4_FRIEND_WARNING');
}

export function betterRestaurantNearby(p: NewnalUserProfile): ScenarioResult {
  const nearbyRestaurants = (p.schedules.nearbyPlaces ?? []).filter((x) => x.category === 'restaurant');
  if (nearbyRestaurants.length < 2) return missed('W5_BETTER_RESTAURANT');
  const target = nearbyRestaurants[0];
  const nearbyNames = new Set(nearbyRestaurants.map((x) => x.name));
  const better = (p.taste.restaurantHistory ?? [])
    .filter((r) => nearbyNames.has(r.name) && r.name !== target.name && r.returnRate > 0.7)
    .sort((a, b) => b.returnRate - a.returnRate)[0];
  if (!better) return missed('W5_BETTER_RESTAURANT');
  const place = nearbyRestaurants.find((x) => x.name === better.name)!;
  return triggered(
    'W5_BETTER_RESTAURANT',
    better.returnRate,
    [
      `You've returned to "${better.name}" ${Math.round(better.returnRate * 100)}% of visits`,
      `"${better.name}" is ${place.distance}m away`,
      `Your return rate at "${target.name}" is much lower`,
    ],
    { current: target, better, betterDistance: place.distance },
  );
}

export function similarProductDisappointment(
  p: NewnalUserProfile,
  targetCategory: string,
): ScenarioResult {
  if (!targetCategory) return missed('W6_SIMILAR_DISAPPOINTMENT');
  const bad = p.spending.purchaseHistory.filter(
    (x) =>
      x.category === targetCategory &&
      (x.returnedOrCancelled || (x.usageAfterPurchase !== undefined && x.usageAfterPurchase < 0.2)),
  );
  if (bad.length < 2) return missed('W6_SIMILAR_DISAPPOINTMENT');
  return triggered(
    'W6_SIMILAR_DISAPPOINTMENT',
    Math.min(bad.length / 5, 1),
    [
      `${bad.length} similar purchases in "${targetCategory}" returned or barely used`,
      `Most recent: "${bad[bad.length - 1].merchant}"`,
    ],
    { category: targetCategory, badPurchases: bad },
  );
}

// ─── Positive nudges ──────────────────────────────────────────────────────

export function seasonalGap(p: NewnalUserProfile): ScenarioResult {
  const month = new Date().getMonth();
  const seasons: { months: number[]; category: string; label: string; nearbyCategory: string[] }[] = [
    { months: [11, 0, 1, 2], category: 'outerwear', label: 'winter jacket', nearbyCategory: ['clothing'] },
    { months: [5, 6, 7, 8], category: 'activewear', label: 'summer gear', nearbyCategory: ['clothing', 'fitness'] },
    { months: [3, 4], category: 'footwear', label: 'spring shoes', nearbyCategory: ['clothing'] },
  ];
  for (const s of seasons) {
    if (!s.months.includes(month)) continue;
    const nearby = (p.schedules.nearbyPlaces ?? []).find((np) => s.nearbyCategory.includes(np.category));
    if (!nearby) continue;
    const last = p.spending.purchaseHistory
      .filter((pp) => pp.category === s.category)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
    if (!last) {
      return triggered(
        'P1_SEASONAL_GAP',
        0.7,
        [
          `No ${s.label} purchase found in your history`,
          `${nearby.name} is ${nearby.distance}m away`,
        ],
        { item: s.label, store: nearby },
      );
    }
    const monthsSince = Math.floor((Date.now() - +new Date(last.date)) / (86_400_000 * 30));
    if (monthsSince > 18) {
      return triggered(
        'P1_SEASONAL_GAP',
        Math.min(monthsSince / 36, 1),
        [
          `Last ${s.label} purchase was ${monthsSince} months ago`,
          `${nearby.name} is ${nearby.distance}m away`,
        ],
        { item: s.label, monthsSince, store: nearby },
      );
    }
  }
  return missed('P1_SEASONAL_GAP');
}

export function dormantInterest(p: NewnalUserProfile): ScenarioResult {
  const searches = p.phoneActivity.searchHistory ?? [];
  const dormant = searches.filter((s) => {
    const days = Math.floor((Date.now() - +new Date(s.date)) / 86_400_000);
    const bought = p.spending.purchaseHistory.some(
      (pp) => pp.category === s.category && +new Date(pp.date) > +new Date(s.date),
    );
    return days > 30 && days < 180 && !bought;
  });
  if (dormant.length === 0) return missed('P2_DORMANT_INTEREST');
  for (const top of dormant) {
    const store = (p.schedules.nearbyPlaces ?? []).find((np) => np.category === top.category);
    if (!store) continue;
    const days = Math.floor((Date.now() - +new Date(top.date)) / 86_400_000);
    return triggered(
      'P2_DORMANT_INTEREST',
      0.75,
      [
        `You researched "${top.query}" ${days} days ago and never bought`,
        `${store.name} carries this category — ${store.distance}m away`,
      ],
      { search: top, store, daysAgo: days },
    );
  }
  return missed('P2_DORMANT_INTEREST');
}

export function newVersionAvailable(p: NewnalUserProfile): ScenarioResult {
  const techCats = ['electronics', 'tech', 'wearables', 'appliances'];
  const tech = p.spending.purchaseHistory.filter((x) => techCats.includes(x.category));
  if (tech.length === 0) return missed('P3_NEW_VERSION');
  const old = tech.filter((x) => {
    const months = Math.floor((Date.now() - +new Date(x.date)) / (86_400_000 * 30));
    return months > 18;
  });
  if (old.length === 0) return missed('P3_NEW_VERSION');
  const store = (p.schedules.nearbyPlaces ?? []).find((np) => np.category === 'electronics');
  if (!store) return missed('P3_NEW_VERSION');
  const oldest = old.sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];
  const months = Math.floor((Date.now() - +new Date(oldest.date)) / (86_400_000 * 30));
  return triggered(
    'P3_NEW_VERSION',
    0.65,
    [
      `Your "${oldest.merchant}" purchase is ${months} months old`,
      `${store.name} is ${store.distance}m away — likely has the new model`,
    ],
    { item: oldest, monthsOld: months, store },
  );
}

export function healthGoalAlignment(p: NewnalUserProfile): ScenarioResult {
  const goals = p.health.fitnessGoals ?? [];
  if (goals.length === 0) return missed('P4_HEALTH_GOAL');
  const stepsOk = p.health.stepsPerDay > 7000;
  const sleepOk = p.health.sleepAverage > 7;
  if (stepsOk && sleepOk) return missed('P4_HEALTH_GOAL');
  const gym = (p.schedules.nearbyPlaces ?? []).find((np) => np.type === 'gym');
  if (!gym) return missed('P4_HEALTH_GOAL');
  const ghostCount = (p.health.gymMemberships ?? []).filter(
    (m) => m.cancelledAfterDays !== undefined && m.cancelledAfterDays < 90,
  ).length;
  if (ghostCount >= 2) return missed('P4_HEALTH_GOAL'); // W1 owns this case
  return triggered(
    'P4_HEALTH_GOAL',
    0.7,
    [
      `Your stated goals include: ${goals.slice(0, 2).join(', ')}`,
      `Average steps/day: ${p.health.stepsPerDay} (below 7,500 target)`,
      `${gym.name} is ${gym.distance}m away`,
    ],
    { goals, steps: p.health.stepsPerDay, gym },
  );
}

export function loyalSpotReminder(p: NewnalUserProfile): ScenarioResult {
  const loyal = (p.taste.restaurantHistory ?? []).filter((r) => r.visitCount >= 5 && r.returnRate > 0.7);
  if (loyal.length === 0) return missed('P5_LOYAL_SPOT');
  const nearby = p.schedules.nearbyPlaces ?? [];
  for (const place of loyal) {
    const m = nearby.find((n) => n.name === place.name);
    if (m) {
      return triggered(
        'P5_LOYAL_SPOT',
        place.returnRate,
        [
          `You've been to "${place.name}" ${place.visitCount} times`,
          `Your return rate: ${Math.round(place.returnRate * 100)}%`,
          `${m.distance}m away right now`,
        ],
        { place, distance: m.distance },
      );
    }
  }
  return missed('P5_LOYAL_SPOT');
}

// ─── Master runner ────────────────────────────────────────────────────────

export function runAllScenarios(
  profile: NewnalUserProfile,
  enabledScenarios: string[],
): ScenarioResult[] {
  // Pick the most plausible nearby category for repeat-regret / similar-disappointment.
  const nearbyCats = (profile.schedules.nearbyPlaces ?? []).map((p) => p.category);
  const repeatCat = nearbyCats.find((c) => ['electronics', 'clothing', 'fitness'].includes(c)) ?? nearbyCats[0] ?? '';

  const all: ScenarioResult[] = [
    ghostGym(profile),
    ghostSubscription(profile),
    repeatRegret(profile, repeatCat),
    friendWarning(profile),
    betterRestaurantNearby(profile),
    similarProductDisappointment(profile, repeatCat),
    seasonalGap(profile),
    dormantInterest(profile),
    newVersionAvailable(profile),
    healthGoalAlignment(profile),
    loyalSpotReminder(profile),
  ];
  return all
    .filter((r) => enabledScenarios.includes(r.scenarioId))
    .filter((r): r is ScenarioResultTriggered => r.triggered)
    .sort((a, b) => b.confidence - a.confidence);
}
