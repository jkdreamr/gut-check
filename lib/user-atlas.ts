import { searchPersonalAis } from './newnal';
import { adaptUserSummary } from './synthesize';
import type { NewnalUser, RealNewnalPersonalAi } from './types';

const ATLAS_PROBES = [
  { label: 'Rich Profiles', query: 'all users with rich profile data' },
  { label: 'California', query: 'users in california with rich profile data' },
  { label: 'Fitness', query: 'anyone near a gym in california' },
  { label: 'Dining', query: 'people who like korean food or restaurants' },
  { label: 'Tech', query: 'people with a tech or electronics shopping pattern' },
  { label: '30s', query: 'users in their thirties exploring fitness goals' },
] as const;

export interface AtlasUser extends NewnalUser {
  surfaces: number;
  probeLabels: string[];
}

export async function discoverUserAtlas(): Promise<{
  users: AtlasUser[];
  probesUsed: number;
}> {
  const results = await Promise.allSettled(
    ATLAS_PROBES.map(async (probe) => {
      const response = await searchPersonalAis(probe.query);
      return { probe, users: response.personal_ai };
    }),
  );

  const merged = new Map<string, { raw: RealNewnalPersonalAi; surfaces: Set<string> }>();

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    for (const user of result.value.users) {
      const existing = merged.get(user.ai_did);
      if (existing) {
        existing.surfaces.add(result.value.probe.label);
        if (user.match_score > existing.raw.match_score) {
          existing.raw = { ...user, match_reason: existing.raw.match_reason || user.match_reason };
        }
      } else {
        merged.set(user.ai_did, {
          raw: user,
          surfaces: new Set([result.value.probe.label]),
        });
      }
    }
  }

  const users = Array.from(merged.values())
    .map(({ raw, surfaces }) => ({
      ...adaptUserSummary(raw),
      surfaces: surfaces.size,
      probeLabels: Array.from(surfaces).sort(),
    }))
    .sort((a, b) =>
      b.surfaces - a.surfaces
      || (b.matchScore ?? 0) - (a.matchScore ?? 0)
      || b.credibilityScore - a.credibilityScore,
    );

  return {
    users,
    probesUsed: ATLAS_PROBES.length,
  };
}
