// lib/synthesize.ts — bridge between the real Newnal API response and
// the idealized NewnalUserProfile that the rule engine consumes.
//
// The real API returns rich data on diet, lifestyle, health, taste,
// values etc. but does NOT include certain signals the spec assumes:
//   - gym cancellation history
//   - subscription usage frequency
//   - friends' ratings of nearby places
//   - phone search history with categories
//   - nearby-places telemetry
// We synthesize those gaps deterministically from a DID-seeded RNG so
// every scenario can fire on real users while remaining reproducible.

import type {
  GymMembership,
  NearbyPlace,
  NewnalUser,
  NewnalUserProfile,
  PhoneActivityData,
  Purchase,
  RadarData,
  RealNewnalDetail,
  RealNewnalPersonalAi,
  RestaurantVisit,
  SocialRating,
  Subscription,
} from './types';
import { makeRng, type SeededRng } from './seeded-random';

// ─── Helpers for safely walking the open-ended JSON ────────────────────────

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}
function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}
function get(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

// Some entries in the API (e.g. identity_qualities) come back as a JSON-
// encoded string rather than an array. Coerce both.
function parseListish(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    } catch {
      // not JSON
    }
    return v.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

// ─── Synthetic data pools (used to fill gaps deterministically) ────────────

const GYM_NAMES = [
  'Equinox', 'Planet Fitness', 'Crunch Fitness', 'Anytime Fitness',
  '24 Hour Fitness', 'Orangetheory', 'F45 Training', 'LA Fitness',
];
const GHOST_SUB_POOL = [
  { name: 'MasterClass', category: 'learning', monthlyCost: 15 },
  { name: 'Audible', category: 'audio', monthlyCost: 14 },
  { name: 'Calm', category: 'wellness', monthlyCost: 13 },
  { name: 'Headspace', category: 'wellness', monthlyCost: 13 },
  { name: 'Peloton App', category: 'fitness', monthlyCost: 13 },
  { name: 'Apple Fitness+', category: 'fitness', monthlyCost: 10 },
  { name: 'New York Times', category: 'news', monthlyCost: 17 },
  { name: 'Substack Pro', category: 'news', monthlyCost: 8 },
  { name: 'Notion Plus', category: 'productivity', monthlyCost: 10 },
];
const SEARCH_POOL: { query: string; category: string }[] = [
  { query: 'best running shoes for flat feet', category: 'footwear' },
  { query: 'standing desk under $400', category: 'furniture' },
  { query: 'noise cancelling headphones review', category: 'electronics' },
  { query: 'merino wool base layer', category: 'outerwear' },
  { query: 'french press vs aeropress', category: 'kitchen' },
  { query: 'kettlebell vs dumbbells home gym', category: 'fitness' },
];
const ELECTRONICS_MERCHANTS = ['Apple Store', 'Best Buy', 'B&H Photo', 'Sonos', 'Bose'];
const CLOTHING_MERCHANTS = ['Patagonia', 'Uniqlo', 'Lululemon', 'Madewell', 'Levi\'s'];

// ─── Profile snapshot derivation ───────────────────────────────────────────

function deriveSnapshot(detail: RealNewnalDetail) {
  const info = asObj(get(detail, ['personal_data', 'basic', 'info']));
  const loc = asObj(get(detail, ['personal_data', 'default', 'current_location']));
  const lifestyle = asObj(get(detail, ['ai_data', 'lifestyle', 'daily_habits']));
  const motivation = asObj(get(detail, ['ai_data', 'values', 'core_motivation']));

  const ageLower = asNumber(info.age_lower) ?? 28;
  const gender = asString(info.gender) ?? '—';
  const localityParts = [asString(loc.locality), asString(loc.admin_area)].filter(Boolean) as string[];
  const location = localityParts.join(', ') || asString(info.hometown) || 'Unknown';

  return {
    age: ageLower,
    gender,
    location,
    persona: asString(lifestyle.eating_habits) ?? 'balanced',
    goal: asString(motivation.motivation_type) ?? 'growth',
  };
}

function deriveCompleteness(detail: RealNewnalDetail): { value: number; radar: RadarData } {
  // Each of these top-level personal_data branches counts toward completeness.
  const branches: [string, string[]][] = [
    ['Basic', ['personal_data', 'basic', 'info']],
    ['Diet', ['personal_data', 'diet', 'food_preferences']],
    ['Style', ['personal_data', 'style']],
    ['Travel', ['personal_data', 'travel']],
    ['Health', ['personal_data', 'health']],
    ['Spending', ['personal_data', 'lifestyle', 'spending']],
    ['Hobbies', ['personal_data', 'hobbies']],
    ['Entertain.', ['personal_data', 'entertainment']],
    ['Lifestyle', ['personal_data', 'lifestyle']],
    ['Phone', ['personal_data', 'phone_activity']],
    ['Character', ['ai_data', 'character']],
    ['Values', ['ai_data', 'values']],
    ['Taste', ['ai_data', 'taste']],
    ['Appearance', ['ai_data', 'appearance']],
  ];
  const radar: RadarData = {};
  let total = 0;
  for (const [label, path] of branches) {
    const obj = get(detail, path);
    const has = obj && typeof obj === 'object' && Object.keys(asObj(obj)).length > 0;
    radar[label] = has ? 0.85 + (Math.random() * 0) : 0.2; // pure structural — ditch RNG noise here
    if (has) total += 1;
  }
  // Re-derive deterministic noise from a stable seed so radar shapes vary visually.
  return { value: total / branches.length, radar };
}

function derivePersonaRadar(detail: RealNewnalDetail): RadarData {
  const character = asObj(get(detail, ['ai_data', 'character']));
  const values = asObj(get(detail, ['ai_data', 'values']));
  const taste = asObj(get(detail, ['ai_data', 'taste']));

  function num(v: unknown, fallback = 0.5): number {
    const n = asNumber(v);
    return typeof n === 'number' ? Math.max(0, Math.min(1, n)) : fallback;
  }
  return {
    Social: num(asObj(character.social_orientation).opinion_sharing),
    Energy: num(asObj(taste.energy_profile).energy_level),
    Openness: num(asObj(character.stress_response).novelty_openness),
    Growth: num(asObj(values.thinking_style).growth_orientation),
    Expressive: num(asObj(character.communication_style).talking_style_expressiveness),
    Warmth: num(asObj(character.communication_style).talking_style_warmth),
    Community: num(asObj(values.social_values).community_orientation),
  };
}

function deriveCredibility(completeness: number, rng: SeededRng): number {
  // 400 baseline + up to 350 from completeness + small RNG jitter.
  const base = 420 + Math.round(completeness * 360);
  return Math.min(990, base + rng.int(-30, 30));
}

// ─── Synthesized deeper data ───────────────────────────────────────────────

function synthGymMemberships(detail: RealNewnalDetail, rng: SeededRng): GymMembership[] {
  const exerciseHabits = asArr(get(detail, ['personal_data', 'lifestyle', 'exercise', 'habits']));
  const moneyMindset = asNumber(get(detail, ['ai_data', 'lifestyle', 'resource_priorities', 'money_mindset'])) ?? 0.5;
  // People with low body_movement + high travel_appetite are more likely to
  // accumulate ghost gyms; tight-budget people too.
  const bodyMovement = asNumber(get(detail, ['ai_data', 'lifestyle', 'daily_habits', 'body_movement'])) ?? 0.5;

  const ghostProb = (1 - bodyMovement) * 0.7 + (1 - moneyMindset) * 0.3;
  const isGhostUser = rng.chance(ghostProb);

  const memberships: GymMembership[] = [];
  if (isGhostUser) {
    const count = rng.int(2, 3);
    let yearOffset = 4;
    for (let i = 0; i < count; i++) {
      const cancelDays = rng.int(28, 80);
      const start = new Date();
      start.setFullYear(start.getFullYear() - yearOffset);
      const end = new Date(start);
      end.setDate(end.getDate() + cancelDays);
      memberships.push({
        name: rng.pick(GYM_NAMES),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        avgVisitsPerMonth: rng.int(1, 4),
        cancelledAfterDays: cancelDays,
      });
      yearOffset -= 1.5;
    }
  } else if (exerciseHabits.length > 0 && rng.chance(0.3)) {
    // One healthy long-running membership.
    const start = new Date();
    start.setFullYear(start.getFullYear() - rng.int(1, 3));
    memberships.push({
      name: rng.pick(GYM_NAMES),
      startDate: start.toISOString(),
      avgVisitsPerMonth: rng.int(8, 16),
    });
  }
  return memberships;
}

function synthSubscriptions(detail: RealNewnalDetail, rng: SeededRng): Subscription[] {
  // Real entertainment.subscriptions.services list is text-only; coerce.
  const realServices = asArr(get(detail, ['personal_data', 'entertainment', 'subscriptions', 'services']))
    .map((s) => (typeof s === 'string' ? s : asString(asObj(s).name) ?? ''))
    .filter(Boolean) as string[];

  const out: Subscription[] = [];
  // Streaming-style subs from real list — usage is moderate.
  for (const name of realServices) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - rng.int(6, 36));
    const lastUsed = new Date();
    lastUsed.setDate(lastUsed.getDate() - rng.int(1, 14));
    out.push({
      id: `sub-real-${name.replace(/\s+/g, '-').toLowerCase()}`,
      name,
      category: 'streaming',
      monthlyCost: rng.pick([10, 13, 16, 18, 20]),
      startDate: startDate.toISOString(),
      lastUsed: lastUsed.toISOString(),
      usageFrequency: rng.pick(['daily', 'weekly', 'monthly'] as const),
    });
  }
  // 1–3 ghost subs the user probably has but the API doesn't track.
  const ghostCount = rng.int(1, 3);
  const pool = rng.sample(GHOST_SUB_POOL, ghostCount);
  for (const ghost of pool) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - rng.int(8, 30));
    const lastUsed = new Date();
    lastUsed.setDate(lastUsed.getDate() - rng.int(35, 180));
    out.push({
      id: `sub-ghost-${ghost.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: ghost.name,
      category: ghost.category,
      monthlyCost: ghost.monthlyCost,
      startDate: startDate.toISOString(),
      lastUsed: lastUsed.toISOString(),
      usageFrequency: rng.pick(['rarely', 'never'] as const),
    });
  }
  return out;
}

function synthPurchases(detail: RealNewnalDetail, rng: SeededRng): Purchase[] {
  const real = asArr(
    get(detail, ['personal_data', 'lifestyle', 'shopping', 'recent_major_purchases']),
  );
  const out: Purchase[] = [];
  let i = 0;
  for (const entry of real) {
    const e = asObj(entry);
    const date = new Date();
    date.setMonth(date.getMonth() - rng.int(2, 30));
    out.push({
      id: `p-real-${i}`,
      category: (asString(e.category) || 'general').toLowerCase(),
      subcategory: asString(e.subcategory) || asString(e.title) || '',
      merchant: asString(e.merchant) || asString(e.title) || 'Local store',
      amount: asNumber(e.amount) ?? rng.int(40, 380),
      date: date.toISOString(),
      usageAfterPurchase: rng.next(),
    });
    i++;
  }
  // Ensure repeat-regret patterns are reachable by injecting a mini cluster
  // for one category at a small probability.
  if (rng.chance(0.65)) {
    const cluster = rng.pick([
      { category: 'electronics', merchants: ELECTRONICS_MERCHANTS },
      { category: 'clothing', merchants: CLOTHING_MERCHANTS },
      { category: 'fitness', merchants: ['Lululemon', 'Nike', 'On Running'] },
    ]);
    const count = rng.int(3, 4);
    for (let j = 0; j < count; j++) {
      const date = new Date();
      date.setMonth(date.getMonth() - rng.int(3, 24));
      out.push({
        id: `p-cluster-${cluster.category}-${j}`,
        category: cluster.category,
        subcategory: cluster.category,
        merchant: rng.pick(cluster.merchants),
        amount: rng.int(45, 320),
        date: date.toISOString(),
        usageAfterPurchase: rng.next() * 0.45, // skew low
        returnedOrCancelled: rng.chance(0.3),
      });
    }
  }
  return out;
}

function synthNearbyPlaces(detail: RealNewnalDetail, rng: SeededRng): NearbyPlace[] {
  // Use real "places" (home/work/etc) + restaurants + a synthetic gym/store.
  const real = asArr(get(detail, ['personal_data', 'lifestyle', 'places', 'items']));
  const restaurants = asArr(get(detail, ['personal_data', 'diet', 'restaurants', 'items']));

  const out: NearbyPlace[] = [];
  for (const r of restaurants.slice(0, 4)) {
    const e = asObj(r);
    out.push({
      name: asString(e.title) || 'Restaurant',
      category: 'restaurant',
      type: 'restaurant',
      distance: rng.int(120, 1800),
    });
  }
  for (const p of real.slice(0, 2)) {
    const e = asObj(p);
    const label = asString(e.label);
    if (!label || label === 'home' || label === 'work') continue;
    out.push({
      name: asString(e.name) || 'Place',
      category: 'general',
      type: 'general',
      distance: rng.int(200, 2200),
    });
  }
  // Always include one gym + one electronics + one clothing store nearby
  // so all 11 scenarios have a chance to fire.
  out.push({
    name: rng.pick(GYM_NAMES),
    category: 'gym',
    type: 'gym',
    distance: rng.int(80, 800),
  });
  out.push({
    name: rng.pick(['Best Buy', 'Apple Store', 'Micro Center']),
    category: 'electronics',
    type: 'electronics',
    distance: rng.int(400, 2200),
  });
  out.push({
    name: rng.pick(['Patagonia', 'Uniqlo', 'Madewell']),
    category: 'clothing',
    type: 'clothing',
    distance: rng.int(300, 1800),
  });
  return out;
}

function synthRestaurantHistory(detail: RealNewnalDetail, rng: SeededRng): RestaurantVisit[] {
  const items = asArr(get(detail, ['personal_data', 'diet', 'restaurants', 'items']));
  const cuisines = parseListish(get(detail, ['personal_data', 'diet', 'food_preferences', 'favorite_cuisines']));
  const out: RestaurantVisit[] = [];
  for (let i = 0; i < items.length; i++) {
    const e = asObj(items[i]);
    const high = i === 0;
    out.push({
      name: asString(e.title) || `Restaurant ${i + 1}`,
      cuisine: cuisines[i % Math.max(1, cuisines.length)] || 'mixed',
      priceRange: rng.int(1, 3),
      visitCount: high ? rng.int(6, 12) : rng.int(2, 5),
      returnRate: high ? 0.78 + rng.next() * 0.2 : rng.next() * 0.6,
      avgRating: high ? 4.2 + rng.next() * 0.7 : 3.0 + rng.next() * 1.5,
      lastVisit: new Date(Date.now() - rng.int(high ? 65 : 10, high ? 140 : 55) * 86_400_000).toISOString(),
    });
  }
  return out;
}

function synthSocialRatings(restaurantHistory: RestaurantVisit[], rng: SeededRng): SocialRating[] {
  // Pick one restaurant the friends rated poorly (W4 trigger) deterministically.
  if (restaurantHistory.length === 0) return [];
  const target = restaurantHistory[restaurantHistory.length - 1];
  const ratings: SocialRating[] = [
    {
      placeName: target.name,
      avgFriendRating: 1.8 + rng.next() * 0.9, // < 3.0
      friendCount: rng.int(3, 7),
    },
  ];
  for (let i = 0; i < restaurantHistory.length - 1; i++) {
    const r = restaurantHistory[i];
    ratings.push({
      placeName: r.name,
      avgFriendRating: 3.5 + rng.next() * 1.3,
      friendCount: rng.int(2, 6),
    });
  }
  return ratings;
}

function synthPhoneActivity(detail: RealNewnalDetail, rng: SeededRng): PhoneActivityData {
  const real = asArr(get(detail, ['personal_data', 'phone_activity', 'phone_activity', 'activities']));
  const topApps = real
    .map((a) => asObj(a))
    .map((a) => ({
      app: asString(a.app_name) || 'Unknown',
      weeklyMinutes: (asNumber(a.duration_minutes) ?? 10) * 7,
    }))
    .slice(0, 6);

  // Synthesize 2–3 dormant searches.
  const searchCount = rng.int(2, 3);
  const searches = rng.sample(SEARCH_POOL, searchCount).map((s) => {
    const date = new Date();
    date.setDate(date.getDate() - rng.int(35, 170));
    return { ...s, date: date.toISOString() };
  });
  const savedItems = searches.map((s) => ({
    category: s.category,
    title: s.query,
    date: s.date,
  }));
  return {
    searchHistory: searches,
    savedItems,
    topApps,
  };
}

// ─── Public API: build the idealized profile ───────────────────────────────

export function adaptUserSummary(personalAi: RealNewnalPersonalAi): NewnalUser {
  const rng = makeRng(personalAi.ai_did);
  const completeness = 0.45 + rng.next() * 0.5;
  return {
    id: personalAi.ai_did,
    displayName: personalAi.ai_name,
    avatarUrl: personalAi.ai_avatar_image_url,
    credibilityScore: deriveCredibility(completeness, rng),
    matchScore: personalAi.match_score,
    matchReason: personalAi.match_reason,
    profileSnapshot: {
      age: 30 + rng.int(-4, 14),
      gender: '—',
      location: '—',
      completeness,
      persona: 'balanced',
      goal: 'growth',
    },
    dataCompleteness: synthSummaryRadar(rng),
    personaProfile: synthSummaryPersonaRadar(rng),
  };
}

function synthSummaryRadar(rng: SeededRng): RadarData {
  const labels = ['Basic', 'Diet', 'Style', 'Travel', 'Health', 'Spending', 'Hobbies', 'Entertain.', 'Lifestyle', 'Phone', 'Character', 'Values', 'Taste', 'Appearance'];
  const out: RadarData = {};
  for (const l of labels) out[l] = 0.55 + rng.next() * 0.4;
  return out;
}
function synthSummaryPersonaRadar(rng: SeededRng): RadarData {
  const labels = ['Social', 'Energy', 'Openness', 'Growth', 'Expressive', 'Warmth', 'Community'];
  const out: RadarData = {};
  for (const l of labels) out[l] = 0.3 + rng.next() * 0.65;
  return out;
}

export function adaptUserDetail(
  personalAi: RealNewnalPersonalAi,
  detail: RealNewnalDetail,
): NewnalUserProfile {
  const rng = makeRng(personalAi.ai_did);
  const snapshot = deriveSnapshot(detail);
  const completenessInfo = deriveCompleteness(detail);
  const personaRadar = derivePersonaRadar(detail);

  const subscriptions = synthSubscriptions(detail, rng);
  const purchases = synthPurchases(detail, rng);
  const restaurantHistory = synthRestaurantHistory(detail, rng);
  const socialRatings = synthSocialRatings(restaurantHistory, rng);
  const nearbyPlaces = synthNearbyPlaces(detail, rng);
  const phoneActivity = synthPhoneActivity(detail, rng);
  const gymMemberships = synthGymMemberships(detail, rng);

  const monthlyAverage = subscriptions.reduce((s, x) => s + x.monthlyCost, 0)
    + purchases.reduce((s, x) => s + x.amount, 0) / 24;

  const topCategories: { category: string; amount: number }[] = [];
  for (const p of purchases) {
    const found = topCategories.find((c) => c.category === p.category);
    if (found) found.amount += p.amount;
    else topCategories.push({ category: p.category, amount: p.amount });
  }
  topCategories.sort((a, b) => b.amount - a.amount);

  const stepsPerDay = (asNumber(get(detail, ['ai_data', 'lifestyle', 'daily_habits', 'body_movement'])) ?? 0.5) * 12000 + rng.int(-1500, 1500);
  const sleepHoursStr = asString(get(detail, ['personal_data', 'lifestyle', 'sleep', 'sleep_hours']));
  const sleepMap: Record<string, number> = { FOUR: 4, FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9 };
  const sleepAverage = (sleepHoursStr && sleepMap[sleepHoursStr]) || 6.5 + rng.next() * 1.5;

  const fitnessGoals = parseListish(get(detail, ['personal_data', 'diet', 'food_preferences', 'dietary_goals']))
    .concat(parseListish(get(detail, ['ai_data', 'values', 'life_goals', 'identity_qualities'])));

  const cuisines = parseListish(get(detail, ['personal_data', 'diet', 'food_preferences', 'favorite_cuisines']));
  const restaurants = asArr(get(detail, ['personal_data', 'diet', 'restaurants', 'items'])).map((x) => {
    const e = asObj(x);
    return { name: asString(e.title) || 'Restaurant', address: asString(e.subtitle) };
  });

  const eduEntries = asArr(get(detail, ['personal_data', 'basic', 'education', 'entries']))
    .map((e) => {
      const o = asObj(e);
      return [asString(o.degree), asString(o.school)].filter(Boolean).join(' · ');
    })
    .filter(Boolean) as string[];
  const expEntries = asArr(get(detail, ['personal_data', 'basic', 'experience', 'entries']))
    .map((e) => {
      const o = asObj(e);
      return [asString(o.position), asString(o.company)].filter(Boolean).join(' @ ');
    })
    .filter(Boolean) as string[];

  const summary: NewnalUser = {
    id: personalAi.ai_did,
    displayName: personalAi.ai_name,
    avatarUrl: personalAi.ai_avatar_image_url,
    credibilityScore: deriveCredibility(completenessInfo.value, rng),
    matchScore: personalAi.match_score,
    matchReason: personalAi.match_reason,
    profileSnapshot: {
      age: snapshot.age,
      gender: snapshot.gender,
      location: snapshot.location,
      completeness: completenessInfo.value,
      persona: snapshot.persona,
      goal: snapshot.goal,
    },
    dataCompleteness: completenessInfo.radar,
    personaProfile: personaRadar,
  };

  const profile: NewnalUserProfile = {
    ...summary,
    basic: {
      name: asString(get(detail, ['personal_data', 'basic', 'info', 'name'])) || personalAi.ai_name,
      ageLower: asNumber(get(detail, ['personal_data', 'basic', 'info', 'age_lower'])) ?? snapshot.age,
      hometown: asString(get(detail, ['personal_data', 'basic', 'info', 'hometown'])),
      relationshipStatus: asString(get(detail, ['personal_data', 'basic', 'info', 'relationship_status'])),
      languages: asArr(get(detail, ['personal_data', 'basic', 'info', 'languages']))
        .map((l) => asString(l) ?? asString(asObj(l).name) ?? '')
        .filter(Boolean),
      education: eduEntries,
      experience: expEntries,
    },
    diet: {
      favoriteCuisines: cuisines,
      cookingFrequency: asString(get(detail, ['personal_data', 'diet', 'food_preferences', 'cooking_frequency'])),
      deliveryFrequency: asString(get(detail, ['personal_data', 'diet', 'food_preferences', 'delivery_frequency'])),
      restaurants,
    },
    health: {
      fitnessGoals,
      exerciseFrequency: asString(get(detail, ['personal_data', 'lifestyle', 'exercise', 'frequency'])) ?? 'moderate',
      gymMemberships,
      sleepAverage,
      stepsPerDay: Math.max(0, Math.round(stepsPerDay)),
    },
    spending: {
      purchaseHistory: purchases,
      subscriptions,
      monthlyAverage: Math.round(monthlyAverage),
      topCategories,
    },
    schedules: {
      currentLocation: undefined,
      nearbyPlaces,
      calendarEvents: [],
      routinePatterns: [],
    },
    taste: {
      restaurantHistory,
      favoriteCategories: cuisines,
      socialCircleRatings: socialRatings,
    },
    phoneActivity,
    lifestyle: {
      dailyHabits: asString(get(detail, ['ai_data', 'lifestyle', 'daily_habits', 'eating_habits'])) ?? 'balanced',
      moneyMindset: asNumber(get(detail, ['ai_data', 'lifestyle', 'resource_priorities', 'money_mindset'])) ?? 0.5,
      workLifeBalance: asNumber(get(detail, ['ai_data', 'lifestyle', 'resource_priorities', 'work_life_balance'])) ?? 0.5,
      livingEnvironment: asString(get(detail, ['ai_data', 'lifestyle', 'living_preferences', 'living_environment'])),
    },
    values: {
      motivationType: asString(get(detail, ['ai_data', 'values', 'core_motivation', 'motivation_type'])),
      identityQualities: parseListish(get(detail, ['ai_data', 'values', 'life_goals', 'identity_qualities'])),
      growthOrientation: asNumber(get(detail, ['ai_data', 'values', 'thinking_style', 'growth_orientation'])) ?? 0.5,
      communityOrientation: asNumber(get(detail, ['ai_data', 'values', 'social_values', 'community_orientation'])) ?? 0.5,
    },
    character: {
      groupRole: asString(get(detail, ['ai_data', 'character', 'communication_style', 'group_role'])),
      expressiveness: asNumber(get(detail, ['ai_data', 'character', 'communication_style', 'talking_style_expressiveness'])) ?? 0.5,
      warmth: asNumber(get(detail, ['ai_data', 'character', 'communication_style', 'talking_style_warmth'])) ?? 0.5,
      opinionSharing: asNumber(get(detail, ['ai_data', 'character', 'social_orientation', 'opinion_sharing'])) ?? 0.5,
      socialComfort: asNumber(get(detail, ['ai_data', 'character', 'social_orientation', 'social_comfort'])) ?? 0.5,
    },
  };
  return profile;
}
