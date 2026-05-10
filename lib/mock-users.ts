// lib/mock-users.ts — fully synthetic users for the /demo flow.
//
// Used when the live API is unavailable or to guarantee deterministic
// triggers for the hackathon demo. Each user is engineered around one or
// two strong decision moments so the demo flow stays predictable.

import type { NewnalUserProfile } from './types';

const NOW = Date.now();
const day = (n: number) => new Date(NOW - n * 86_400_000).toISOString();
const months = (n: number) => new Date(NOW - n * 30 * 86_400_000).toISOString();

const baseRadar = {
  Basic: 0.92, Diet: 0.81, Style: 0.74, Travel: 0.66, Health: 0.78, Spending: 0.85,
  Hobbies: 0.7, 'Entertain.': 0.83, Lifestyle: 0.79, Phone: 0.77, Character: 0.86,
  Values: 0.82, Taste: 0.74, Appearance: 0.71,
};
const basePersona = {
  Social: 0.65, Energy: 0.72, Openness: 0.6, Growth: 0.78, Expressive: 0.7,
  Warmth: 0.74, Community: 0.62,
};

export const MOCK_USERS: NewnalUserProfile[] = [
  // ─── Alex — fires Ghost Gym ─────────────────────────────────────────────
  {
    id: 'demo:alex',
    displayName: 'Alex Park',
    credibilityScore: 812,
    profileSnapshot: {
      age: 28, gender: 'Female', location: 'San Francisco, CA',
      completeness: 0.86, persona: 'healthy_mindful', goal: 'consistency',
    },
    dataCompleteness: baseRadar,
    personaProfile: basePersona,
    basic: {
      name: 'Alex Park',
      ageLower: 28,
      hometown: 'San Francisco, CA',
      relationshipStatus: 'SINGLE',
      languages: ['English', 'Korean'],
      education: ['BS Computer Science · UC Berkeley'],
      experience: ['Product Designer @ Figma'],
    },
    diet: {
      favoriteCuisines: ['Korean', 'Japanese', 'Mediterranean'],
      cookingFrequency: 'TWO_TIMES_A_WEEK',
      deliveryFrequency: 'TWO_OR_THREE_TIMES_A_MONTH',
      restaurants: [{ name: 'Hinodeya Ramen', address: 'Japantown' }],
    },
    health: {
      fitnessGoals: ['lose 10 lbs', 'build a running habit'],
      exerciseFrequency: 'sporadic',
      gymMemberships: [
        {
          name: 'Equinox SoMa',
          startDate: months(36).toString(),
          endDate: months(35).toString(),
          avgVisitsPerMonth: 4,
          cancelledAfterDays: 47,
        },
        {
          name: 'Barry\'s Bootcamp',
          startDate: months(18).toString(),
          endDate: months(17).toString(),
          avgVisitsPerMonth: 3,
          cancelledAfterDays: 63,
        },
      ],
      sleepAverage: 6.2,
      stepsPerDay: 4200,
    },
    spending: {
      purchaseHistory: [],
      subscriptions: [
        { id: 's-1', name: 'Spotify', category: 'streaming', monthlyCost: 11, startDate: months(18), lastUsed: day(1), usageFrequency: 'daily' },
      ],
      monthlyAverage: 240,
      topCategories: [{ category: 'food', amount: 320 }],
    },
    schedules: {
      nearbyPlaces: [
        { name: 'Crunch Fitness', category: 'gym', type: 'gym', distance: 180 },
        { name: 'Whole Foods', category: 'grocery', type: 'grocery', distance: 540 },
      ],
      calendarEvents: [],
      routinePatterns: [],
    },
    taste: { restaurantHistory: [], favoriteCategories: [], socialCircleRatings: [] },
    phoneActivity: { searchHistory: [], savedItems: [], topApps: [{ app: 'Instagram', weeklyMinutes: 380 }] },
    lifestyle: { dailyHabits: 'healthy_mindful', moneyMindset: 0.4, workLifeBalance: 0.6, livingEnvironment: 'urban' },
    values: { motivationType: 'growth', identityQualities: ['ambitious', 'creative'], growthOrientation: 0.82, communityOrientation: 0.55 },
    character: { groupRole: 'connector', expressiveness: 0.7, warmth: 0.75, opinionSharing: 0.6, socialComfort: 0.7 },
  },

  // ─── Jordan — fires Friend Warning ──────────────────────────────────────
  {
    id: 'demo:jordan',
    displayName: 'Jordan Reyes',
    credibilityScore: 745,
    profileSnapshot: {
      age: 34, gender: 'Male', location: 'Palo Alto, CA',
      completeness: 0.79, persona: 'social_explorer', goal: 'connection',
    },
    dataCompleteness: { ...baseRadar, Diet: 0.92, Taste: 0.91 },
    personaProfile: { ...basePersona, Social: 0.88, Warmth: 0.83 },
    basic: {
      name: 'Jordan Reyes',
      ageLower: 34,
      hometown: 'Palo Alto, CA',
      relationshipStatus: 'IN_RELATIONSHIP',
      languages: ['English', 'Spanish'],
      education: ['MBA · Stanford GSB'],
      experience: ['VP Marketing @ Stripe'],
    },
    diet: {
      favoriteCuisines: ['Italian', 'Mexican', 'Thai'],
      cookingFrequency: 'ONCE_A_WEEK',
      deliveryFrequency: 'WEEKLY',
      restaurants: [
        { name: 'Reposado', address: '236 Hamilton Ave' },
        { name: 'Bird Dog', address: '420 Ramona' },
      ],
    },
    health: {
      fitnessGoals: ['stay healthy'],
      exerciseFrequency: 'regular',
      gymMemberships: [{ name: 'Equinox Palo Alto', startDate: months(24), avgVisitsPerMonth: 12 }],
      sleepAverage: 7.4,
      stepsPerDay: 9100,
    },
    spending: {
      purchaseHistory: [],
      subscriptions: [],
      monthlyAverage: 480,
      topCategories: [{ category: 'food', amount: 480 }],
    },
    schedules: {
      nearbyPlaces: [
        { name: 'Tava Indian Kitchen', category: 'restaurant', type: 'restaurant', distance: 110 },
        { name: 'Reposado', category: 'restaurant', type: 'restaurant', distance: 540 },
      ],
      calendarEvents: [],
      routinePatterns: [],
    },
    taste: {
      restaurantHistory: [
        { name: 'Reposado', cuisine: 'Mexican', priceRange: 3, visitCount: 9, returnRate: 0.89, avgRating: 4.6, lastVisit: day(18) },
        { name: 'Tava Indian Kitchen', cuisine: 'Indian', priceRange: 2, visitCount: 2, returnRate: 0.2, avgRating: 3.0, lastVisit: day(7) },
      ],
      favoriteCategories: ['Italian', 'Mexican'],
      socialCircleRatings: [
        { placeName: 'Tava Indian Kitchen', avgFriendRating: 2.3, friendCount: 5 },
        { placeName: 'Reposado', avgFriendRating: 4.5, friendCount: 4 },
      ],
    },
    phoneActivity: { searchHistory: [], savedItems: [], topApps: [{ app: 'Slack', weeklyMinutes: 1100 }] },
    lifestyle: { dailyHabits: 'social', moneyMindset: 0.7, workLifeBalance: 0.5, livingEnvironment: 'suburban' },
    values: { motivationType: 'connection', identityQualities: ['outgoing', 'analytical'], growthOrientation: 0.8, communityOrientation: 0.78 },
    character: { groupRole: 'connector', expressiveness: 0.85, warmth: 0.83, opinionSharing: 0.75, socialComfort: 0.88 },
  },

  // ─── Sam — fires Dormant Interest ───────────────────────────────────────
  {
    id: 'demo:sam',
    displayName: 'Sam Chen',
    credibilityScore: 678,
    profileSnapshot: {
      age: 26, gender: 'Non-binary', location: 'Menlo Park, CA',
      completeness: 0.72, persona: 'curious_starter', goal: 'momentum',
    },
    dataCompleteness: { ...baseRadar, Phone: 0.92 },
    personaProfile: { ...basePersona, Openness: 0.9, Growth: 0.88 },
    basic: {
      name: 'Sam Chen',
      ageLower: 26,
      hometown: 'Menlo Park, CA',
      relationshipStatus: 'SINGLE',
      languages: ['English', 'Mandarin'],
      education: ['BS Mech. Engineering · Cal Poly'],
      experience: ['Hardware Engineer @ Tesla'],
    },
    diet: { favoriteCuisines: ['Vietnamese', 'Indian'], restaurants: [] },
    health: {
      fitnessGoals: ['start running'],
      exerciseFrequency: 'rare',
      gymMemberships: [],
      sleepAverage: 6.8,
      stepsPerDay: 5400,
    },
    spending: {
      purchaseHistory: [],
      subscriptions: [
        { id: 's-2', name: 'MasterClass', category: 'learning', monthlyCost: 15, startDate: months(14), lastUsed: day(140), usageFrequency: 'never' },
      ],
      monthlyAverage: 130,
      topCategories: [{ category: 'electronics', amount: 220 }],
    },
    schedules: {
      nearbyPlaces: [
        { name: 'Fleet Feet', category: 'footwear', type: 'footwear', distance: 220 },
      ],
      calendarEvents: [],
      routinePatterns: [],
    },
    taste: { restaurantHistory: [], favoriteCategories: [], socialCircleRatings: [] },
    phoneActivity: {
      searchHistory: [
        { query: 'best running shoes for flat feet', category: 'footwear', date: day(45) },
      ],
      savedItems: [{ category: 'footwear', title: 'Brooks Ghost 16', date: day(45) }],
      topApps: [{ app: 'YouTube', weeklyMinutes: 720 }],
    },
    lifestyle: { dailyHabits: 'curious', moneyMindset: 0.55, workLifeBalance: 0.7, livingEnvironment: 'urban' },
    values: { motivationType: 'mastery', identityQualities: ['curious', 'analytical', 'patient'], growthOrientation: 0.88, communityOrientation: 0.5 },
    character: { groupRole: 'thinker', expressiveness: 0.55, warmth: 0.7, opinionSharing: 0.5, socialComfort: 0.55 },
  },

  // ─── Maya — fires Repeat Regret / Similar Disappointment ───────────────
  {
    id: 'demo:maya',
    displayName: 'Maya Patel',
    credibilityScore: 801,
    profileSnapshot: {
      age: 31, gender: 'Female', location: 'San Francisco, CA',
      completeness: 0.88, persona: 'tasteful_optimizer', goal: 'intentional_spending',
    },
    dataCompleteness: { ...baseRadar, Spending: 0.93, Taste: 0.79, Phone: 0.84 },
    personaProfile: { ...basePersona, Growth: 0.84, Openness: 0.68, Community: 0.58 },
    basic: {
      name: 'Maya Patel',
      ageLower: 31,
      hometown: 'San Francisco, CA',
      relationshipStatus: 'IN_RELATIONSHIP',
      languages: ['English', 'Hindi'],
      education: ['BA Economics · UCLA'],
      experience: ['Brand Strategist @ Notion'],
    },
    diet: {
      favoriteCuisines: ['Mediterranean', 'Indian', 'Japanese'],
      cookingFrequency: 'THREE_TIMES_A_WEEK',
      deliveryFrequency: 'WEEKLY',
      restaurants: [{ name: 'Nopa', address: 'Divisadero St' }],
    },
    health: {
      fitnessGoals: ['sleep better', 'lift consistently'],
      exerciseFrequency: 'moderate',
      gymMemberships: [{ name: 'Fitness SF', startDate: months(20), avgVisitsPerMonth: 8 }],
      sleepAverage: 6.9,
      stepsPerDay: 6900,
    },
    spending: {
      purchaseHistory: [
        {
          id: 'p-m1',
          category: 'electronics',
          subcategory: 'audio',
          merchant: 'Sony XM4',
          amount: 348,
          date: months(14),
          usageAfterPurchase: 0.18,
          returnedOrCancelled: true,
        },
        {
          id: 'p-m2',
          category: 'electronics',
          subcategory: 'audio',
          merchant: 'AirPods Max',
          amount: 549,
          date: months(9),
          usageAfterPurchase: 0.22,
          returnedOrCancelled: false,
        },
        {
          id: 'p-m3',
          category: 'electronics',
          subcategory: 'audio',
          merchant: 'Beats Studio Pro',
          amount: 319,
          date: months(4),
          usageAfterPurchase: 0.14,
          returnedOrCancelled: true,
        },
      ],
      subscriptions: [
        { id: 's-m1', name: 'Apple Music', category: 'streaming', monthlyCost: 11, startDate: months(22), lastUsed: day(2), usageFrequency: 'daily' },
      ],
      monthlyAverage: 360,
      topCategories: [{ category: 'electronics', amount: 1216 }],
    },
    schedules: {
      nearbyPlaces: [
        { name: 'Apple Store', category: 'electronics', type: 'electronics', distance: 90 },
        { name: 'Aesop', category: 'general', type: 'general', distance: 180 },
      ],
      calendarEvents: [{ title: 'Commute home', startsAt: day(0), category: 'routine' }],
      routinePatterns: [{ label: 'Post-work browse', description: 'Often browses gadgets after work before heading home.' }],
    },
    taste: {
      restaurantHistory: [{ name: 'Nopa', cuisine: 'Californian', priceRange: 3, visitCount: 6, returnRate: 0.78, avgRating: 4.5, lastVisit: day(21) }],
      favoriteCategories: ['electronics', 'home'],
      socialCircleRatings: [],
    },
    phoneActivity: {
      searchHistory: [
        { query: 'best headphones for focus', category: 'electronics', date: day(25) },
        { query: 'sony xm5 vs airpods max', category: 'electronics', date: day(12) },
      ],
      savedItems: [{ category: 'electronics', title: 'Sony XM5', date: day(12) }],
      topApps: [{ app: 'TikTok', weeklyMinutes: 280 }],
    },
    lifestyle: { dailyHabits: 'intentional', moneyMindset: 0.66, workLifeBalance: 0.62, livingEnvironment: 'urban' },
    values: { motivationType: 'clarity', identityQualities: ['tasteful', 'driven'], growthOrientation: 0.84, communityOrientation: 0.54 },
    character: { groupRole: 'editor', expressiveness: 0.63, warmth: 0.71, opinionSharing: 0.64, socialComfort: 0.67 },
  },

  // ─── Leo — fires Ghost Subscription ────────────────────────────────────
  {
    id: 'demo:leo',
    displayName: 'Leo Brooks',
    credibilityScore: 764,
    profileSnapshot: {
      age: 38, gender: 'Male', location: 'Mountain View, CA',
      completeness: 0.83, persona: 'overcommitted_builder', goal: 'financial_breathing_room',
    },
    dataCompleteness: { ...baseRadar, Spending: 0.95, Lifestyle: 0.88 },
    personaProfile: { ...basePersona, Growth: 0.76, Energy: 0.66, Community: 0.48 },
    basic: {
      name: 'Leo Brooks',
      ageLower: 38,
      hometown: 'Mountain View, CA',
      relationshipStatus: 'MARRIED',
      languages: ['English'],
      education: ['MS EE · Georgia Tech'],
      experience: ['Engineering Manager @ NVIDIA'],
    },
    diet: {
      favoriteCuisines: ['Thai', 'Mexican'],
      cookingFrequency: 'ONCE_A_WEEK',
      deliveryFrequency: 'TWO_OR_THREE_TIMES_A_WEEK',
      restaurants: [{ name: 'Vive Sol', address: 'Mountain View' }],
    },
    health: {
      fitnessGoals: ['sleep more', 'reduce stress'],
      exerciseFrequency: 'rare',
      gymMemberships: [],
      sleepAverage: 5.8,
      stepsPerDay: 5100,
    },
    spending: {
      purchaseHistory: [
        {
          id: 'p-l1',
          category: 'home',
          subcategory: 'coffee',
          merchant: 'Fellow',
          amount: 99,
          date: months(11),
          usageAfterPurchase: 0.56,
        },
      ],
      subscriptions: [
        { id: 's-l1', name: 'MasterClass', category: 'learning', monthlyCost: 15, startDate: months(18), lastUsed: day(121), usageFrequency: 'never' },
        { id: 's-l2', name: 'Calm', category: 'wellness', monthlyCost: 16, startDate: months(24), lastUsed: day(74), usageFrequency: 'rarely' },
        { id: 's-l3', name: 'Peloton App', category: 'fitness', monthlyCost: 27, startDate: months(9), lastUsed: day(52), usageFrequency: 'rarely' },
        { id: 's-l4', name: 'Spotify Family', category: 'streaming', monthlyCost: 19, startDate: months(36), lastUsed: day(1), usageFrequency: 'daily' },
      ],
      monthlyAverage: 510,
      topCategories: [{ category: 'subscription', amount: 77 }],
    },
    schedules: {
      nearbyPlaces: [
        { name: 'Blue Bottle', category: 'general', type: 'general', distance: 130 },
        { name: 'Target', category: 'general', type: 'general', distance: 420 },
      ],
      calendarEvents: [{ title: 'Monthly budget review', startsAt: day(0), category: 'finance' }],
      routinePatterns: [{ label: 'Autopay Friday', description: 'Most recurring digital subscriptions renew on Fridays.' }],
    },
    taste: {
      restaurantHistory: [{ name: 'Vive Sol', cuisine: 'Mexican', priceRange: 2, visitCount: 5, returnRate: 0.72, avgRating: 4.1, lastVisit: day(34) }],
      favoriteCategories: ['learning', 'wellness'],
      socialCircleRatings: [],
    },
    phoneActivity: {
      searchHistory: [{ query: 'how to cancel subscriptions on iphone', category: 'subscription', date: day(41) }],
      savedItems: [],
      topApps: [{ app: 'Slack', weeklyMinutes: 980 }],
    },
    lifestyle: { dailyHabits: 'busy', moneyMindset: 0.45, workLifeBalance: 0.36, livingEnvironment: 'suburban' },
    values: { motivationType: 'stability', identityQualities: ['reliable', 'curious'], growthOrientation: 0.72, communityOrientation: 0.44 },
    character: { groupRole: 'builder', expressiveness: 0.48, warmth: 0.62, opinionSharing: 0.46, socialComfort: 0.61 },
  },
];

export const MOCK_USERS_BY_ID: Record<string, NewnalUserProfile> = Object.fromEntries(
  MOCK_USERS.map((u) => [u.id, u]),
);
