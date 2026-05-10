import Link from 'next/link';
import { ArrowRight, BrainCircuit, MapPin, ShieldAlert, Sparkles } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { ProposalCard } from '@/components/proposals/ProposalCard';
import { AcceptanceRateBar } from '@/components/proposals/AcceptanceRateBar';
import { prisma } from '@/lib/prisma';
import { explainDatabaseIssue, hasValidPostgresDatabaseUrl } from '@/lib/database';
import { SCENARIOS, SCENARIO_META_BY_ID, isGeneratedScenarioId } from '@/lib/scenarios';
import { discoverUsers } from '@/lib/newnal';

async function getUserCount(): Promise<number> {
  try {
    const users = await discoverUsers('anyone with a rich profile', {
      revalidate: 60,
      tags: ['dashboard-user-count'],
    });
    return users.length;
  } catch {
    return 0;
  }
}

export async function AppDashboard() {
  const waveSpeedActive = Boolean(process.env.WAVESPEED_API_KEY?.trim());
  const newnalConfigured = Boolean(process.env.NEWNAL_API_KEY?.trim());
  let databaseWarning: string | null = null;
  let allLogs: Awaited<ReturnType<typeof prisma.proposalLog.findMany>> = [];
  let todaysLogs = 0;
  let totalSent = 0;
  let totalAccepted = 0;
  let counts: Array<{ scenarioId: string; _count: { _all: number } }> = [];
  let acceptCounts: Array<{ scenarioId: string; _count: { _all: number } }> = [];
  let seenScenarios: Array<{ scenarioId: string; scenarioName: string; scenarioType: string }> = [];
  const userCountPromise = getUserCount();

  try {
    [allLogs, todaysLogs, totalSent, totalAccepted, counts, acceptCounts, seenScenarios] = await Promise.all([
      prisma.proposalLog.findMany({ orderBy: { sentAt: 'desc' }, take: 5 }),
      prisma.proposalLog.count({
        where: { sentAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.proposalLog.count(),
      prisma.proposalLog.count({ where: { accepted: true } }),
      prisma.proposalLog.groupBy({
        by: ['scenarioId'],
        _count: { _all: true },
      }),
      prisma.proposalLog.groupBy({
        by: ['scenarioId'],
        where: { accepted: true },
        _count: { _all: true },
      }),
      prisma.proposalLog.findMany({
        select: {
          scenarioId: true,
          scenarioName: true,
          scenarioType: true,
        },
        distinct: ['scenarioId'],
        orderBy: { sentAt: 'desc' },
      }),
    ]);
  } catch (error) {
    const explanation = explainDatabaseIssue(error);
    console.warn(`Dashboard database telemetry unavailable: ${explanation}`);
    if (hasValidPostgresDatabaseUrl()) {
      databaseWarning = explanation;
    }
  }
  const userCount = await userCountPromise;

  const acceptanceRate = totalSent === 0 ? 0 : Math.round((totalAccepted / totalSent) * 100);
  const countById = Object.fromEntries(counts.map((row) => [row.scenarioId, row._count._all]));
  const acceptById = Object.fromEntries(acceptCounts.map((row) => [row.scenarioId, row._count._all]));
  const generatedScenarios = seenScenarios
    .filter((scenario) => !SCENARIO_META_BY_ID[scenario.scenarioId] && isGeneratedScenarioId(scenario.scenarioId))
    .map((scenario) => ({
      id: scenario.scenarioId,
      name: scenario.scenarioName,
      type: scenario.scenarioType as 'warning' | 'nudge',
      generated: true,
    }));
  const trackedScenarios = [
    ...SCENARIOS.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      type: scenario.type,
      generated: false,
    })),
    ...generatedScenarios,
  ];
  const acceptanceRows = trackedScenarios
    .map((scenario) => ({
      scenarioName: scenario.name,
      type: scenario.type,
      fired: countById[scenario.id] ?? 0,
      accepted: acceptById[scenario.id] ?? 0,
      generated: scenario.generated,
    }))
    .filter((row) => row.fired > 0)
    .sort((a, b) => b.fired - a.fired);
  const trackedPatternCount = trackedScenarios.length;

  return (
    <main>
      <TopBar
        title="Gut Check"
        subtitle="Real people, real timing, real Newnal pings."
        right={(
          <>
            <Link
              href="/demo"
              className="app-button-primary px-4 py-2.5"
            >
              Open demo
            </Link>
            <Link
              href="/users"
              className="app-button-secondary px-4 py-2.5"
            >
              Search people
            </Link>
          </>
        )}
      />

      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 space-y-8">
        <section className="panel-elevated relative overflow-hidden p-8">
          <div className="hairline-grid absolute inset-0 opacity-50" />
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_340px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill icon={<Sparkles className="size-3.5" />} label="Newnal Circle" />
                <Pill icon={<MapPin className="size-3.5" />} label="Decision moments" />
                <Pill icon={<BrainCircuit className="size-3.5" />} label="Adaptive scoring" />
                {waveSpeedActive && <Pill icon={<ShieldAlert className="size-3.5" />} label="Live synthesis" />}
              </div>
              <h1 className="mt-5 max-w-4xl font-display text-4xl tracking-[-0.03em] text-white md:text-5xl">
                It waits for the moment that actually matters.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Gut Check looks at a person&apos;s history, location, habits, and current decision. Then it decides whether to stay quiet or send one timely nudge to their Newnal phone.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/demo"
                  className="app-button-primary"
                >
                  Run the demo
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/users"
                  className="app-button-secondary"
                >
                  Try a real person
                </Link>
              </div>
            </div>

            <div className="panel-soft p-5">
              <p className="app-kicker">How it behaves</p>
              <div className="mt-4 space-y-3">
                <Doctrine
                  title="Less noise"
                  body="A weak nudge is worse than silence. Gut Check would rather wait than send filler."
                />
                <Doctrine
                  title="More than 11 fixed cases"
                  body={waveSpeedActive ? 'The core rules still anchor the product, but WaveSpeed keeps adding new scenario ideas based on each person and each moment.' : 'The core rules already cover the main regret and follow-through patterns. Add a WaveSpeed key to let the agent invent more.'}
                />
                <Doctrine
                  title="Real send path"
                  body={newnalConfigured ? 'When the model says yes on a real user, the ping goes to their actual Newnal phone.' : 'Newnal is not configured here yet, so the app will stay in safe demo behavior.'}
                />
              </div>
            </div>
          </div>
        </section>

        {databaseWarning && (
          <div className="panel-muted border-amber-300/20 bg-amber-300/[0.08] px-4 py-3 text-sm text-amber-100">
            {databaseWarning}
          </div>
        )}

        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Metric label="People found" value={userCount.toString()} sub="from Newnal search" />
          <Metric label="Pings today" value={todaysLogs.toString()} sub="sent or simulated" />
          <Metric label="Acceptance" value={`${acceptanceRate}%`} sub={`${totalAccepted} accepted of ${totalSent}`} />
          <Metric
            label="Coverage"
            value={trackedPatternCount.toString()}
            sub={waveSpeedActive ? 'core rules plus generated patterns' : 'core rules only'}
          />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
          <div className="panel-soft p-6">
            <div>
              <p className="app-kicker">Learning loop</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">What gets better over time</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Every accepted or dismissed ping changes the floor for the next one. The agent learns which patterns deserve an interrupt and which ones should stay quiet.
              </p>
              {acceptanceRows.some((row) => row.generated) && (
                <p className="mt-2 text-xs text-slate-400">
                  Fresh WaveSpeed cases now count here too once they have been sent.
                </p>
              )}
            </div>
            {acceptanceRows.length === 0 ? (
              <div className="panel-muted mt-6 border-dashed px-6 py-12 text-center text-sm text-slate-400">
                No pings yet. Run the demo or open a real person to start the loop.
              </div>
            ) : (
              <div className="mt-4">
                <AcceptanceRateBar data={acceptanceRows} />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="panel-soft p-6">
              <p className="app-kicker">Latest ping</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Most recent message</h2>
              {allLogs[0] ? (
                <div className="mt-5 flex items-start gap-6">
                  <ProposalCard
                    isLive
                    size="md"
                    headline={allLogs[0].headline}
                    body={allLogs[0].body}
                    scenarioName={allLogs[0].scenarioName}
                    scenarioType={allLogs[0].scenarioType as 'warning' | 'nudge'}
                  />
                  <div className="max-w-xs text-sm text-slate-300">
                    <p className="font-medium text-white">Sent to {allLogs[0].userName}</p>
                    <p className="mt-2">
                      {new Date(allLogs[0].sentAt).toLocaleString()} ·{' '}
                      <code className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-300">
                        {allLogs[0].scenarioId}
                      </code>
                    </p>
                    <p className="mt-3 text-xs leading-6 text-slate-400">
                      {allLogs[0].accepted === true
                        ? 'It worked. That pattern now gets more trust.'
                        : allLogs[0].accepted === false
                        ? 'It missed. The agent will be more careful next time.'
                        : 'Waiting for feedback on whether this one landed.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="panel-muted mt-5 border-dashed px-6 py-12 text-center text-sm text-slate-400">
                  No pings yet.
                </div>
              )}
            </div>

            <div className="panel-soft p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="app-kicker">Next steps</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Where to go next</h2>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <QuickLink href="/demo" title="Live demo" body="Fastest way to show the agent reading a moment and deciding whether to send." />
                <QuickLink href="/users" title="Real people" body="Search Newnal, open a person, and let Gut Check decide whether to ping them." />
                <QuickLink href="/proposals" title="Message history" body="See what has already gone out and what people accepted or ignored." />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="app-pill text-cyan-100">
      {icon}
      {label}
    </span>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="panel-soft p-5">
      <p className="app-kicker">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

function Doctrine({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel-muted p-4">
      <p className="font-display text-lg tracking-tight text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-300">{body}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="panel-muted block px-4 py-4 transition-colors hover:border-cyan-300/[0.30] hover:bg-white/[0.08]"
    >
      <p className="font-medium text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-300">{body}</p>
    </Link>
  );
}
