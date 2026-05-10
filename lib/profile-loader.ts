import { MOCK_USERS_BY_ID } from './mock-users';
import { getPersonalAi } from './newnal';
import { adaptUserDetail } from './synthesize';
import type { NewnalUserProfile } from './types';

export async function loadUserProfile(
  did: string,
): Promise<{ profile?: NewnalUserProfile; error?: string }> {
  if (did.startsWith('demo:')) {
    const profile = MOCK_USERS_BY_ID[did];
    if (!profile) return { error: 'Unknown demo user' };
    return { profile };
  }

  try {
    const detail = await getPersonalAi(did);
    const profile = adaptUserDetail(
      { ai_did: did, ai_name: 'Personal AI', match_score: 0 },
      detail,
    );
    return { profile };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
