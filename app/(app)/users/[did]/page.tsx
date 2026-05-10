// app/users/[did]/page.tsx — Personal AI detail with radar charts and Gut Check.

import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { UserDataRadar } from '@/components/users/UserDataRadar';
import { AnalyzePanel } from '@/components/users/AnalyzePanel';
import { deriveLikelyDecisionMoments } from '@/lib/decision-moments';
import { loadUserProfile } from '@/lib/profile-loader';
import { credibilityColor, initials, shortDid } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ did: string }> | { did: string };
}

export default async function UserDetailPage({ params }: Props) {
  const p = await Promise.resolve(params);
  const did = decodeURIComponent(p.did);

  const { profile, error } = await loadUserProfile(did);

  if (!profile) {
    return (
      <main>
        <TopBar title="User not found" />
        <div className="px-8 py-8">
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">
            {error ?? 'Unknown user.'}
          </div>
          <Link href="/users" className="text-sm text-rose-600 hover:underline mt-4 inline-block">
            ← Back to Plaza
          </Link>
        </div>
      </main>
    );
  }

  const completenessPct = Math.round(profile.profileSnapshot.completeness * 100);
  const likelyMoments = deriveLikelyDecisionMoments(profile);

  return (
    <main>
      <TopBar
        title={profile.displayName}
        subtitle={`${profile.profileSnapshot.age} · ${profile.profileSnapshot.location} · ${shortDid(profile.id)}`}
        right={(
          <>
            <Link
              href={`/demo?did=${encodeURIComponent(profile.id)}`}
              className="app-button-primary px-4 py-2.5"
            >
              Open demo
            </Link>
            <Link
              href="/users"
              className="app-button-secondary px-4 py-2.5"
            >
              Back
            </Link>
          </>
        )}
      />
      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 space-y-6">
        {/* Header summary */}
        <section className="panel-elevated grid grid-cols-1 gap-6 p-6 md:grid-cols-12">
          <div className="md:col-span-4 flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,rgba(126,231,255,0.18),rgba(132,144,255,0.18))] font-semibold text-cyan-100 text-xl">
              {initials(profile.displayName)}
            </div>
            <div>
              <p className="app-kicker">Credibility</p>
              <p className={`text-4xl font-semibold tabular-nums ${credibilityColor(profile.credibilityScore)}`}>
                {profile.credibilityScore}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">{completenessPct}% data completeness</p>
            </div>
          </div>
          <div className="md:col-span-8">
            <p className="app-kicker mb-2">Profile snapshot</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                profile.profileSnapshot.persona,
                profile.profileSnapshot.goal,
                profile.basic.relationshipStatus,
                ...(profile.basic.languages ?? []).slice(0, 3),
                ...(profile.diet.favoriteCuisines ?? []).slice(0, 3),
              ]
                .filter(Boolean)
                .map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-200">
                    {tag}
                  </span>
                ))}
            </div>
            {profile.basic.experience.length > 0 && (
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Experience: </span>
                {profile.basic.experience.slice(0, 2).join(' · ')}
              </p>
            )}
            {profile.basic.education.length > 0 && (
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Education: </span>
                {profile.basic.education.slice(0, 2).join(' · ')}
              </p>
            )}
          </div>
        </section>

        {/* Radar charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="panel-soft p-6">
            <h3 className="mb-1 text-sm font-semibold text-white">Data Completeness</h3>
            <p className="mb-3 text-xs text-slate-400">Coverage across personal_data and ai_data branches.</p>
            <UserDataRadar data={profile.dataCompleteness} variant="completeness" showAxis />
          </div>
          <div className="panel-soft p-6">
            <h3 className="mb-1 text-sm font-semibold text-white">Persona Profile</h3>
            <p className="mb-3 text-xs text-slate-400">Synthesized from ai_data character / values / taste.</p>
            <UserDataRadar data={profile.personaProfile} variant="persona" showAxis />
          </div>
        </section>

        {/* Gut Check Analyze */}
        <AnalyzePanel
          userId={profile.id}
          userName={profile.displayName}
          moments={likelyMoments}
        />

        {/* Insight breakdown by category */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryCard title="Spending signal">
            <Stat label="Monthly average" value={`$${profile.spending.monthlyAverage}`} />
            <Stat label="Active subscriptions" value={profile.spending.subscriptions.length.toString()} />
            <Stat
              label="Ghost subs (rarely/never)"
              value={profile.spending.subscriptions
                .filter((s) => s.usageFrequency === 'rarely' || s.usageFrequency === 'never').length.toString()}
            />
            <Stat label="Recent purchases" value={profile.spending.purchaseHistory.length.toString()} />
          </CategoryCard>
          <CategoryCard title="Health & exercise">
            <Stat label="Steps / day" value={profile.health.stepsPerDay.toLocaleString()} />
            <Stat label="Sleep / night" value={`${profile.health.sleepAverage.toFixed(1)} hrs`} />
            <Stat label="Past gyms" value={profile.health.gymMemberships.length.toString()} />
            <Stat
              label="Cancelled <90 days"
              value={profile.health.gymMemberships.filter((g) => (g.cancelledAfterDays ?? 999) < 90).length.toString()}
            />
          </CategoryCard>
          <CategoryCard title="Diet & taste">
            <Stat label="Favorite cuisines" value={profile.diet.favoriteCuisines.slice(0, 4).join(', ') || '—'} />
            <Stat label="Restaurants tracked" value={profile.taste.restaurantHistory.length.toString()} />
            <Stat
              label="Loyal spots (5+ visits, >70% return)"
              value={profile.taste.restaurantHistory.filter((r) => r.visitCount >= 5 && r.returnRate > 0.7).length.toString()}
            />
          </CategoryCard>
          <CategoryCard title="Schedules & nearby">
            <Stat
              label="Nearby places"
              value={(profile.schedules.nearbyPlaces ?? []).length.toString()}
            />
            <Stat
              label="Categories nearby"
              value={Array.from(new Set((profile.schedules.nearbyPlaces ?? []).map((p) => p.category))).join(', ') || '—'}
            />
            <Stat
              label="Dormant searches"
              value={profile.phoneActivity.searchHistory.length.toString()}
            />
          </CategoryCard>
        </section>
      </div>
    </main>
  );
}

function CategoryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel-soft p-6">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] py-1.5 last:border-0">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="truncate text-right text-sm font-medium text-white">{value}</dd>
    </div>
  );
}
