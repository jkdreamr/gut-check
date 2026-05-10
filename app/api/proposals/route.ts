// app/api/proposals/route.ts — list proposal log entries with optional acceptance toggling.
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { prisma } = await import('@/lib/prisma');
  const logs = await prisma.proposalLog.findMany({
    orderBy: { sentAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({
    logs: logs.map((l) => ({
      ...l,
      evidence: tryParseArray(l.evidence),
    })),
  });
}

export async function PATCH(req: NextRequest) {
  let body: { id?: string; accepted?: boolean | null };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { prisma } = await import('@/lib/prisma');
  const updated = await prisma.proposalLog.update({
    where: { id: body.id },
    data: {
      accepted: body.accepted ?? null,
      acceptedAt: body.accepted ? new Date() : null,
    },
  });
  return NextResponse.json({ log: updated });
}

function tryParseArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
