// app/api/scenarios/route.ts — list/update scenario configs.
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SCENARIOS } from '@/lib/scenarios';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Make sure every scenario from the registry has a row.
  const existing = await prisma.scenarioConfig.findMany();
  const existingIds = new Set(existing.map((c) => c.id));
  const toCreate = SCENARIOS.filter((s) => !existingIds.has(s.id));
  if (toCreate.length > 0) {
    await prisma.scenarioConfig.createMany({
      data: toCreate.map((s) => ({ id: s.id, name: s.name, type: s.type, enabled: true, threshold: 0.5 })),
    });
  }

  const configs = await prisma.scenarioConfig.findMany();
  const configById = Object.fromEntries(configs.map((c) => [c.id, c]));

  // Stats: count of fired proposals per scenario from the log.
  const counts = await prisma.proposalLog.groupBy({
    by: ['scenarioId'],
    _count: { _all: true },
    _sum: { confidence: true },
  });
  const acceptCounts = await prisma.proposalLog.groupBy({
    by: ['scenarioId'],
    where: { accepted: true },
    _count: { _all: true },
  });
  const acceptById = Object.fromEntries(acceptCounts.map((a) => [a.scenarioId, a._count._all]));
  const countById = Object.fromEntries(counts.map((c) => [c.scenarioId, c._count._all]));

  return NextResponse.json({
    scenarios: SCENARIOS.map((s) => ({
      ...s,
      enabled: configById[s.id]?.enabled ?? true,
      threshold: configById[s.id]?.threshold ?? 0.5,
      fired: countById[s.id] ?? 0,
      accepted: acceptById[s.id] ?? 0,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  let body: { id?: string; enabled?: boolean; threshold?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const meta = SCENARIOS.find((s) => s.id === body.id);
  if (!meta) return NextResponse.json({ error: 'unknown scenario' }, { status: 400 });

  const data: { enabled?: boolean; threshold?: number; name: string; type: string } = {
    name: meta.name,
    type: meta.type,
  };
  if (body.enabled !== undefined) data.enabled = body.enabled;
  if (body.threshold !== undefined) data.threshold = Math.max(0, Math.min(1, body.threshold));

  const config = await prisma.scenarioConfig.upsert({
    where: { id: body.id },
    create: { id: body.id, ...data, enabled: data.enabled ?? true, threshold: data.threshold ?? 0.5 },
    update: data,
  });
  return NextResponse.json({ config });
}
