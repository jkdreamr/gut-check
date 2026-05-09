// app/api/users/route.ts — discovery endpoint backed by Newnal /personal-ai/search.
//
// Accepts ?q=<NL query>. Returns adapted NewnalUser summary objects so
// the dashboard never has to deal with the raw shape.

import { NextResponse, type NextRequest } from 'next/server';
import { searchPersonalAis } from '@/lib/newnal';
import { adaptUserSummary } from '@/lib/synthesize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || 'all users with rich profile data';
  try {
    const search = await searchPersonalAis(q);
    return NextResponse.json({
      query: q,
      reasoning: search.reasoning,
      users: search.personal_ai.map(adaptUserSummary),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
