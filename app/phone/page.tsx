import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  BellRing, BrainCircuit, Compass, HeartHandshake, MapPin, MoonStar, Search, ShieldCheck,
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { ProposalCard } from '@/components/proposals/ProposalCard';
import { buildAutonomyDecision } from '@/lib/autonomy';
import { loadUserProfile } from '@/lib/profile-loader';
import { prisma } from '@/lib/prisma';
import { generateProposalSync } from '@/lib/proposal-generator';
import { ALL_SCENARIO_IDS } from '@/lib/scenarios';
import { runAllScenarios } from '@/lib/rule-engine';
import { initials, scenarioBadgeClass, shortDid } from '@/lib/utils';
import type { ScenarioResultTriggered } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DEMO_LINKS = [
  { id: 'demo:alex', label: 'Alex' },
  { id: 'demo:jordan', label: 'Jordan' },
  { id: 'demo:sam', label: 'Sam' },
];

interface SearchProps {
  searchParams: Promise<{ did?: string }> | { did?: string };
}

export default async function PhonePage({ searchParams }: SearchProps) {
  const params = await Promise.resolve(searchParams);
  const did = params?.did ? decodeURIComponent(params.did) : 'demo:alex';
  const { profile, error } = await loadUserProfile(did);

  if (!profile) {
    return (
      <main>
        <TopBar title="Phone OS" subtitle="Could not load this user into the phone simulation." />
        <div className="px-8 py-8">
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">
            {error ?? 'Unknown user.'}
          </div>
        </div>
      </main>
    );
  }

  const [recentUserLogs, counts, acceptCounts] = await Promise.all([
    prisma.proposalLog.findMany({
      where: { userId: profile.id },
      orderBy: { sentAt: 'desc' },
      take: 8,
    }),
    prisma.proposalLog.groupBy({
      by: ['scenarioId'],
      _count: { _all: true },
    }),
    prisma.proposalLog.groupBy({
      by: ['scenarioId'],
      where: { accepted: true },
      _count: { _all: true },
    }),
  ]);

  const acceptById = Object.fromEntries(acceptCounts.map((row) => [row.scenarioId, row._count._all]));
  const performanceByScenario = Object.fromEntries(
    counts.map((row) => {
      const accepted = acceptById[row.scenarioId] ?? 0;
      const fired = row._count._all;
      return [
        row.scenarioId,
        {
          fired,
          accepted,
          acceptanceRate: fired > 0 ? accepted / fired : null,
        },
      ];
    }),
  );

  const triggered = runAllScenarios(profile, ALL_SCENARIO_IDS).filter(
    (result): result is ScenarioResultTriggered => result.triggered === true,
  );
  const autonomy = await buildAutonomyDecision({
    profile,
    triggered,
    recentUserProposals: recentUserLogs.map((log) => ({
      scenarioId: log.scenarioId,
      scenarioType: log.scenarioType as 'warning' | 'nudge',
      sentAt: log.sentAt.toISOString(),
      accepted: log.accepted,
    })),
    performanceByScenario,
  });

  const primaryCandidate = autonomy.primaryScenarioId
    ? autonomy.candidates.find((candidate) => candidate.scenarioId === autonomy.primaryScenarioId)
    : autonomy.candidates[0];
  const primaryScenario = primaryCandidate
    ? triggered.find((result) => result.scenarioId === primaryCandidate.scenarioId)
    : undefined;
  const primaryProposal = primaryScenario ? generateProposalSync(primaryScenario, profile) : null;

  const totalAccepted = recentUserLogs.filter((log) => log.accepted === true).length;
  const trustIndex = recentUserLogs.length > 0
    ? Math.round((totalAccepted / recentUserLogs.length) * 100)
    : Math.round((profile.profileSnapshot.completeness * 0.45 + 0.4) * 100);
  const memoryTags = [
    profile.profileSnapshot.persona,
    profile.profileSnapshot.goal,
    ...profile.diet.favoriteCuisines.slice(0, 2),
    ...profile.values.identityQualities.slice(0, 2),
  ].filter(Boolean).slice(0, 6);
  const nearbyPlaces = (profile.schedules.nearbyPlaces ?? []).slice(0, 4);
  const recentSearches = profile.phoneActivity.searchHistory.slice(0, 2);
  const timeLabel = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());

  return (
    <main>
      <TopBar
        title="Phone OS"
        subtitle="A handset-native simulation of how The Gut Check would feel from the user’s side, not the operator’s."
        right={(
          <>
            <Link
              href={`/users/${encodeURIComponent(profile.id)}`}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Analyst View
            </Link>
            <Link
              href="/database"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-slate-900"
            >
              Atlas
            </Link>
          </>
        )}
      />
      <div className="px-8 py-8 space-y-8 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.12),_transparent_25%),linear-gradient(180deg,_#f8fafc_0%,_#fffaf2_100%)] min-h-screen">
        <section className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Load Into Phone</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {DEMO_LINKS.map((demo) => (
                  <Link
                    key={demo.id}
                    href={`/phone?did=${encodeURIComponent(demo.id)}`}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      profile.id === demo.id
                        ? 'bg-slate-950 text-cyan-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {demo.label}
                  </Link>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Current DID: <span className="font-mono text-slate-800">{shortDid(profile.id)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Why this is different</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>It shows the agent as a first-class phone resident, not a dashboard popup.</li>
                <li>Trust, timing, and memory are visible from the user’s point of view.</li>
                <li>The user experiences a living companion feed, not just a single card.</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Intervention status</p>
              <div className={`mt-3 rounded-2xl px-4 py-4 ${autonomy.recommendedAction === 'send_now' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                <p className="text-sm font-semibold">
                  {autonomy.recommendedAction === 'send_now'
                    ? 'The agent would interrupt right now.'
                    : 'The agent would wait for a cleaner moment.'}
                </p>
                <p className="text-xs mt-1 opacity-80">{autonomy.summaryBody}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-[340px] rounded-[2.7rem] border-[10px] border-slate-950 bg-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.22)] overflow-hidden">
              <div className="relative h-[760px] bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.22),_transparent_30%),linear-gradient(180deg,_#0f172a_0%,_#111827_34%,_#1f2937_100%)] text-white">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
                <div className="px-5 pt-5 pb-3 flex items-center justify-between text-[12px] text-slate-300">
                  <span>{timeLabel}</span>
                  <span>{profile.profileSnapshot.location}</span>
                </div>

                <div className="px-5 space-y-4 pb-5">
                  <section className="rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-2xl bg-cyan-300/20 flex items-center justify-center text-cyan-200 font-semibold">
                        {initials(profile.displayName)}
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{profile.displayName}</p>
                        <p className="text-xs text-slate-300">Newnal Companion Surface</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <PhoneStat label="Trust index" value={`${trustIndex}%`} icon={<HeartHandshake className="size-4" />} />
                      <PhoneStat label="Completeness" value={`${Math.round(profile.profileSnapshot.completeness * 100)}%`} icon={<ShieldCheck className="size-4" />} />
                    </div>
                  </section>

                  <section className="rounded-[2rem] bg-white text-slate-950 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Now on phone</p>
                        <p className="text-lg font-semibold mt-1">
                          {autonomy.recommendedAction === 'send_now' ? 'Incoming Gut Check' : 'Agent standing by'}
                        </p>
                      </div>
                      {primaryCandidate && (
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${scenarioBadgeClass(primaryCandidate.scenarioType)}`}>
                          {primaryCandidate.scenarioName}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{autonomy.summaryHeadline}</p>
                    {primaryProposal ? (
                      <div className="mt-4 flex justify-center">
                        <ProposalCard
                          isLive
                          size="sm"
                          headline={primaryProposal.headline}
                          body={primaryProposal.body}
                          scenarioName={primaryScenario?.scenarioName}
                          scenarioType={primaryScenario?.scenarioType}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                        No notification should surface right now.
                      </div>
                    )}
                  </section>

                  <section className="rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BrainCircuit className="size-4 text-cyan-200" />
                      <p className="text-sm font-semibold">Memory threads</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {memoryTags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section className="grid grid-cols-2 gap-3">
                    <div className="rounded-[1.5rem] bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Compass className="size-4 text-cyan-200" />
                        <p className="text-sm font-semibold">Nearby now</p>
                      </div>
                      <div className="space-y-2">
                        {nearbyPlaces.map((place) => (
                          <div key={`${place.name}-${place.distance}`} className="rounded-xl bg-white/5 px-3 py-2">
                            <p className="text-sm">{place.name}</p>
                            <p className="text-[11px] text-slate-300">{place.category} · {place.distance}m</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Search className="size-4 text-cyan-200" />
                        <p className="text-sm font-semibold">Dormant intent</p>
                      </div>
                      <div className="space-y-2">
                        {recentSearches.map((search) => (
                          <div key={search.query} className="rounded-xl bg-white/5 px-3 py-2">
                            <p className="text-sm">{search.query}</p>
                            <p className="text-[11px] text-slate-300">{search.category}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[2rem] bg-white text-slate-950 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BellRing className="size-4 text-slate-500" />
                      <p className="text-sm font-semibold">Circle inbox</p>
                    </div>
                    <div className="space-y-2">
                      {recentUserLogs.length === 0 ? (
                        <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
                          No prior circles for this user yet.
                        </div>
                      ) : (
                        recentUserLogs.slice(0, 3).map((log) => (
                          <div key={log.id} className="rounded-xl bg-slate-50 px-3 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium">{log.headline}</p>
                              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                                {log.accepted === true ? 'Accepted' : log.accepted === false ? 'Dismissed' : 'Pending'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{log.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <div className="rounded-[1.5rem] bg-black/40 border border-white/10 px-5 py-3 flex items-center justify-between text-slate-300">
                    <PhoneTab icon={<MoonStar className="size-4" />} label="Home" active />
                    <PhoneTab icon={<MapPin className="size-4" />} label="Moments" />
                    <PhoneTab icon={<BellRing className="size-4" />} label="Circles" />
                    <PhoneTab icon={<BrainCircuit className="size-4" />} label="Memory" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PhoneStat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/8 px-3 py-3">
      <div className="flex items-center gap-2 text-cyan-200">{icon}</div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 mt-2">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function PhoneTab({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.16em] ${active ? 'text-cyan-300' : 'text-slate-500'}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
