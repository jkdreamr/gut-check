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
        title="Pings"
        subtitle="What Gut Check sent, what Newnal says happened, and the feedback loop that teaches the agent what was worth interrupting for."
      />
      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 space-y-8">
        {databaseWarning && (
          <div className="panel-muted border-amber-300/20 bg-amber-300/[0.08] px-4 py-3 text-sm text-amber-100">
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
