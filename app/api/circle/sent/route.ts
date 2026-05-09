// app/api/circle/sent/route.ts — proxy /circle/sent so the dashboard can
// show the "Live from Newnal" view of what really arrived.

import { NextResponse, type NextRequest } from 'next/server';
import { getSentCircles } from '@/lib/newnal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = url.searchParams.get('page');
  const pageSize = url.searchParams.get('page_size');
  const recipient = url.searchParams.get('recipient_did');
  try {
    const data = await getSentCircles({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      recipientDid: recipient ?? undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
