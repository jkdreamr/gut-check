// app/proposals/page.tsx — Proposal history (local Prisma + live Newnal).

import { TopBar } from '@/components/layout/TopBar';
import { ProposalsTable } from '@/components/proposals/ProposalsTable';
import { LiveSentPanel } from '@/components/proposals/LiveSentPanel';
import { explainDatabaseIssue } from '@/lib/database';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ProposalsPage() {
  let databaseWarning: string | null = null;
  let logs: Awaited<ReturnType<typeof prisma.proposalLog.findMany>> = [];

  try {
    logs = await prisma.proposalLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 200,
    });
  } catch (error) {
    databaseWarning = explainDatabaseIssue(error);
    console.warn(`Proposal history unavailable: ${databaseWarning}`);
  }

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
        {databaseWarning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {databaseWarning}
          </div>
        )}
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
