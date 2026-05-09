// app/page.tsx — Dashboard home.

import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { ProposalCard } from '@/components/proposals/ProposalCard';
import { AcceptanceRateBar } from '@/components/proposals/AcceptanceRateBar';
import { prisma } from '@/lib/prisma';
import { SCENARIOS } from '@/lib/scenarios';
import { scenarioBadgeClass } from '@/lib/utils';
import { discoverUsers } from '@/lib/newnal';

export const dynamic = 'force-dynamic';

async function getUserCount(): Promise<number> {
  try {
    const users = await discoverUsers('anyone with a rich profile');
    return users.length;
  } catch {
    return 0;
  }
}

export default async function HomePage() {
  const [userCount, allLogs, todaysLogs, configs] = await Promise.all([
    getUserCount(),
    prisma.proposalLog.findMany({ orderBy: { sentAt: 'desc' }, take: 5 }),
    prisma.proposalLog.count({
      where: { sentAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.scenarioConfig.findMany(),
  ]);

  const totalSent = await prisma.proposalLog.count();
  const totalAccepted = await prisma.proposalLog.count({ where: { accepted: true } });
  const acceptanceRate = totalSent === 0 ? 0 : Math.round((totalAccepted / totalSent) * 100);

  const enabledCount = configs.filter((c) => c.enabled).length || SCENARIOS.length;

  // Acceptance per scenario
  const counts = await prisma.proposalLog.groupBy({
    by: ['scenarioId'],
    _count: { _all: true },
  });
  const acceptCounts = await prisma.proposalLog.groupBy({
    by: ['scenarioId'],
    where: { accepted: true },
    _count: { _all: true },
  });
  const countById = Object.fromEntries(counts.map((c) => [c.scenarioId, c._count._all]));
  const acceptById = Object.fromEntries(acceptCounts.map((a) => [a.scenarioId, a._count._all]));
  const acceptanceRows = SCENARIOS
    .map((s) => ({
      scenarioName: s.name,
      type: s.type,
      fired: countById[s.id] ?? 0,
      accepted: acceptById[s.id] ?? 0,
    }))
    .filter((row) => row.fired > 0)
    .sort((a, b) => b.fired - a.fired);

  return (
    <main>
      <TopBar
        title="Dashboard"
        subtitle="The Gut Check fires personalized, data-driven proposals at the moment of decision."
        right={
          <Link
            href="/users"
            className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Discover users
          </Link>
        }
      />
      <div className="px-8 py-8 space-y-8">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Users discovered" value={userCount.toString()} sub="via Newnal Plaza" />
          <Metric label="Proposals sent today" value={todaysLogs.toString()} sub="across all users" />
          <Metric label="Acceptance rate" value={`${acceptanceRate}%`} sub={`${totalAccepted} of ${totalSent}`} />
          <Metric label="Active scenarios" value={`${enabledCount}/${SCENARIOS.length}`} sub="rules online" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Acceptance by scenario</h2>
              <Link href="/proposals" className="text-xs text-rose-600 hover:underline">
                View all proposals →
              </Link>
            </div>
            {acceptanceRows.length === 0 ? (
              <div className="text-sm text-gray-500 py-12 text-center">
                No proposals sent yet. Open a user and fire one to populate this chart.
              </div>
            ) : (
              <AcceptanceRateBar data={acceptanceRows} />
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Recent proposals</h2>
            {allLogs.length === 0 ? (
              <div className="text-sm text-gray-500 py-8 text-center">
                Nothing yet. Try the demo or analyze a real user.
              </div>
            ) : (
              <ul className="space-y-3">
                {allLogs.map((log) => (
                  <li key={log.id} className="border-b last:border-0 border-gray-100 pb-3 last:pb-0">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span
                        className={`uppercase tracking-wider px-2 py-0.5 rounded-full ${scenarioBadgeClass(
                          log.scenarioType as 'warning' | 'nudge',
                        )}`}
                      >
                        {log.scenarioName}
                      </span>
                      <span className="text-gray-400">→ {log.userName}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">{log.headline}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{log.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {allLogs[0] && (
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Most recent on the phone</h2>
            <div className="flex items-start gap-8">
              <ProposalCard
                isLive
                size="md"
                headline={allLogs[0].headline}
                body={allLogs[0].body}
                scenarioName={allLogs[0].scenarioName}
                scenarioType={allLogs[0].scenarioType as 'warning' | 'nudge'}
              />
              <div className="text-sm text-gray-600 max-w-md">
                <p className="text-gray-900 font-medium mb-2">Sent to {allLogs[0].userName}</p>
                <p>
                  {new Date(allLogs[0].sentAt).toLocaleString()} · scenario{' '}
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">
                    {allLogs[0].scenarioId}
                  </code>
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-[11px] uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-3xl font-semibold text-gray-900 mt-2 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
