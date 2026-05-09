// app/proposals/page.tsx — Proposal history (local Prisma + live Newnal).

import { TopBar } from '@/components/layout/TopBar';
import { ProposalsTable } from '@/components/proposals/ProposalsTable';
import { LiveSentPanel } from '@/components/proposals/LiveSentPanel';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ProposalsPage() {
  const logs = await prisma.proposalLog.findMany({
    orderBy: { sentAt: 'desc' },
    take: 200,
  });

  const enriched = logs.map((l) => ({
    ...l,
    sentAt: l.sentAt.toISOString(),
    acceptedAt: l.acceptedAt?.toISOString() ?? null,
    evidence: tryParseArray(l.evidence),
  }));

  return (
    <main>
      <TopBar
        title="Proposal history"
        subtitle="Every Newnal-Circle The Gut Check has fired. Toggle acceptance to track downstream signal."
      />
      <div className="px-8 py-8 space-y-8">
        <ProposalsTable logs={enriched} />
        <LiveSentPanel />
      </div>
    </main>
  );
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
