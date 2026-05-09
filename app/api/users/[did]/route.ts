// app/api/users/[did]/route.ts — fetch one Personal AI's detail and return
// the adapted NewnalUserProfile.

import { NextResponse, type NextRequest } from 'next/server';
import { getPersonalAi } from '@/lib/newnal';
import { adaptUserDetail } from '@/lib/synthesize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { did: string } },
) {
  const did = decodeURIComponent(params.did);
  try {
    const detail = await getPersonalAi(did);
    const profile = adaptUserDetail(
      { ai_did: did, ai_name: 'Personal AI', match_score: 0 },
      detail,
    );
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
