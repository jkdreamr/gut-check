// lib/types.ts — Type definitions for The Gut Check.
//
// Two layers of types:
//   1. RealNewnal* — match the *actual* shape returned by the
//      Newnal Service Agent API (`/personal-ai/search`,
//      `/personal-ai/{did}`, `/circle/simple`, `/circle/sent`).
//   2. NewnalUser / NewnalUserProfile — the *idealized* shape the
//      rule engine consumes. We synthesize this from the real
//      response in `lib/synthesize.ts`, filling gaps deterministically
//      from a DID-seeded RNG so every scenario can fire on real users.

// ─── Real API shapes (from openapi.json) ───────────────────────────────────

export interface RealNewnalPersonalAi {
  ai_did: string;
  ai_name: string;
  ai_avatar_image_url?: string;
  ai_avatar_video_url?: string;
  match_score: number;
  match_reason?: string;
}

export interface RealNewnalSearchResponse {
  reasoning: string;
  personal_ai: RealNewnalPersonalAi[];
}

export type RealNewnalDetail = {
  personal_data?: Record<string, unknown>;
  ai_data?: Record<string, unknown>;
  [k: string]: unknown;
};

export interface SimpleCircleRequest {
  target_personal_ai_did: string;
  circle_title: string;
  text_message?: string;
  media_url?: string;
}

export interface CircleSendResult {
  circle_id: string;
  success: boolean;
  error?: string;
}

export interface TemplateCircleRequest {
  target_personal_ai_did: string;
  circle_title: string;
  circle_title_voice_url?: string;
  circle_background_image_url?: string;
  circle_background_video_url?: string;
  ui_template_preset_key: string;
  ui_template_placeholders?: Record<string, string>;
}

export interface SentCircleEntry {
  circle_id: string;
  circle_title: string;
  circle_message?: string;
  created_at: string;
  activated_at?: string | null;
  is_active: boolean;
  circle_media?: Record<string, unknown>;
}

export interface SentRecipientGroup {
  personal_ai_did: string;
  personal_ai_name?: string;
  ai_avatar_image_url?: string;
  ai_avatar_video_url?: string;
  total_circles?: number;
  last_sent_at?: string;
  circles: SentCircleEntry[];
}

export interface SentCirclesResponse {
  recipients: SentRecipientGroup[];
  total: number;
  page: number;
  page_size: number;
}

export interface DriveUploadResponse {
  url: string;
  size_bytes?: number;
  content_type?: string;
}

// ─── Idealized profile shape consumed by the rule engine ──────────────────

export type RadarData = Record<string, number>;

export interface ProfileSnapshot {
  age: number;
  gender: string;
  location: string;
  completeness: number; // 0–1
  persona: string;
  goal: string;
}

export interface NewnalUser {
  id: string;            // DID
  displayName: string;
  avatarUrl?: string;
  credibilityScore: number;
  matchScore?: number;
  matchReason?: string;
  profileSnapshot: ProfileSnapshot;
  dataCompleteness: RadarData;
  personaProfile: RadarData;
}

export interface Purchase {
  id: string;
  category: string;
  subcategory: string;
  merchant: string;
  amount: number;
  date: string;
  usageAfterPurchase?: number;
  returnedOrCancelled?: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  category: string;
  monthlyCost: number;
  startDate: string;
  lastUsed: string;
  usageFrequency: 'daily' | 'weekly' | 'monthly' | 'rarely' | 'never';
}

export interface CategorySpend {
  category: string;
  amount: number;
}

export interface SpendingData {
  purchaseHistory: Purchase[];
  subscriptions: Subscription[];
  monthlyAverage: number;
  topCategories: CategorySpend[];
}

export interface GymMembership {
  name: string;
  startDate: string;
  endDate?: string;
  avgVisitsPerMonth: number;
  cancelledAfterDays?: number;
}

export interface HealthData {
  fitnessGoals: string[];
  exerciseFrequency: string;
  gymMemberships: GymMembership[];
  sleepAverage: number;
  stepsPerDay: number;
}

export interface NearbyPlace {
  name: string;
  category: string;
  distance: number; // meters
  type: string; // 'gym' | 'restaurant' | 'store' | 'electronics' | 'clothing' | ...
}

export interface CalendarEvent {
  title: string;
  startsAt: string;
  category?: string;
}

export interface RoutinePattern {
  label: string;
  description: string;
}

export interface SchedulesData {
  currentLocation?: { lat: number; lng: number; placeName: string };
  nearbyPlaces?: NearbyPlace[];
  calendarEvents: CalendarEvent[];
  routinePatterns: RoutinePattern[];
}

export interface RestaurantVisit {
  name: string;
  cuisine: string;
  priceRange: number; // 1–4
  visitCount: number;
  returnRate: number; // 0–1
  avgRating: number;
}

export interface SocialRating {
  placeName: string;
  avgFriendRating: number; // 0–5
  friendCount: number;
}

export interface TasteData {
  restaurantHistory: RestaurantVisit[];
  favoriteCategories: string[];
  socialCircleRatings: SocialRating[];
}

export interface PhoneSearch {
  query: string;
  category: string;
  date: string;
}

export interface PhoneSavedItem {
  category: string;
  title: string;
  date: string;
}

export interface PhoneActivityData {
  searchHistory: PhoneSearch[];
  savedItems: PhoneSavedItem[];
  topApps: { app: string; weeklyMinutes: number }[];
}

export interface NewnalUserProfile extends NewnalUser {
  basic: { name: string; ageLower?: number; hometown?: string; relationshipStatus?: string; languages: string[]; education: string[]; experience: string[] };
  diet: { favoriteCuisines: string[]; cookingFrequency?: string; deliveryFrequency?: string; restaurants: { name: string; address?: string }[] };
  health: HealthData;
  spending: SpendingData;
  schedules: SchedulesData;
  taste: TasteData;
  phoneActivity: PhoneActivityData;
  lifestyle: { dailyHabits: string; moneyMindset: number; workLifeBalance: number; livingEnvironment?: string };
  values: { motivationType?: string; identityQualities: string[]; growthOrientation: number; communityOrientation: number };
  character: { groupRole?: string; expressiveness: number; warmth: number; opinionSharing: number; socialComfort: number };
}

// ─── Rule engine result ────────────────────────────────────────────────────

export type ScenarioType = 'warning' | 'nudge';

export interface ScenarioResultTriggered {
  triggered: true;
  scenarioId: string;
  scenarioName: string;
  scenarioType: ScenarioType;
  confidence: number;
  evidencePoints: string[];
  proposalContext: Record<string, unknown>;
}

export interface ScenarioResultMissed {
  triggered: false;
  scenarioId: string;
  scenarioName: string;
  scenarioType: ScenarioType;
}

export type ScenarioResult = ScenarioResultTriggered | ScenarioResultMissed;

export interface ScenarioPerformanceSnapshot {
  fired: number;
  accepted: number;
  acceptanceRate: number | null;
}

export interface RecentProposalSummary {
  scenarioId: string;
  scenarioType: ScenarioType;
  sentAt: string;
  accepted: boolean | null;
}

export interface AutonomyCandidate {
  scenarioId: string;
  scenarioName: string;
  scenarioType: ScenarioType;
  posture: 'send_now' | 'watch' | 'hold';
  confidence: number;
  sendScore: number;
  adaptiveFloor: number;
  acceptancePrediction: number;
  timingScore: number;
  fatiguePenalty: number;
  behaviorFit: number;
  historicalAcceptance: number | null;
  creativeDirection: string;
  reasons: string[];
}

export interface AutonomyDecision {
  policyModel: string;
  operatorInvolvement: 'none';
  recommendedAction: 'send_now' | 'hold';
  primaryScenarioId?: string;
  summaryHeadline: string;
  summaryBody: string;
  narrative: string[];
  candidates: AutonomyCandidate[];
}

// ─── Proposal payload used by the API route ────────────────────────────────

export interface ProposalPayload {
  userId: string;
  userName?: string;
  scenarioId: string;
  scenarioName: string;
  scenarioType: ScenarioType;
  confidence: number;
  evidence: string[];
  headline: string;
  body: string;
  ctaLabel?: string;
}

export interface AnalyzeResponse {
  user: NewnalUser;
  results: ScenarioResultTriggered[];
  topProposals: {
    scenario: ScenarioResultTriggered;
    headline: string;
    body: string;
    source: 'template' | 'claude';
  }[];
  autonomy: AutonomyDecision;
}
