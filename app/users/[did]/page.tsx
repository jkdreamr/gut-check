// app/users/[did]/page.tsx — Personal AI detail with radar charts and Gut Check.

import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { UserDataRadar } from '@/components/users/UserDataRadar';
import { AnalyzePanel } from '@/components/users/AnalyzePanel';
import { getPersonalAi } from '@/lib/newnal';
import { adaptUserDetail } from '@/lib/synthesize';
import { credibilityColor, initials, shortDid } from '@/lib/utils';
import { MOCK_USERS_BY_ID } from '@/lib/mock-users';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ did: string }> | { did: string };
}

export default async function UserDetailPage({ params }: Props) {
  const p = await Promise.resolve(params);
  const did = decodeURIComponent(p.did);

  let profile;
  let error: string | undefined;

  if (did.startsWith('demo:')) {
    profile = MOCK_USERS_BY_ID[did];
    if (!profile) error = 'Unknown demo user';
  } else {
    try {
      const detail = await getPersonalAi(did);
      profile = adaptUserDetail({ ai_did: did, ai_name: 'Personal AI', match_score: 0 }, detail);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

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

  return (
    <main>
      <TopBar
        title={profile.displayName}
        subtitle={`${profile.profileSnapshot.age} · ${profile.profileSnapshot.location} · ${shortDid(profile.id)}`}
        right={
          <Link
            href="/users"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back
          </Link>
        }
      />
      <div className="px-8 py-8 space-y-6">
        {/* Header summary */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 flex items-start gap-4">
            <div className="size-16 shrink-0 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center text-rose-700 font-semibold text-xl">
              {initials(profile.displayName)}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-400">Credibility</p>
              <p className={`text-4xl font-semibold tabular-nums ${credibilityColor(profile.credibilityScore)}`}>
                {profile.credibilityScore}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">{completenessPct}% data completeness</p>
            </div>
          </div>
          <div className="md:col-span-8">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">Profile snapshot</p>
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
                  <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
            </div>
            {profile.basic.experience.length > 0 && (
              <p className="text-sm text-gray-600">
                <span className="text-gray-400">Experience: </span>
                {profile.basic.experience.slice(0, 2).join(' · ')}
              </p>
            )}
            {profile.basic.education.length > 0 && (
              <p className="text-sm text-gray-600">
                <span className="text-gray-400">Education: </span>
                {profile.basic.education.slice(0, 2).join(' · ')}
              </p>
            )}
          </div>
        </section>

        {/* Radar charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-sm text-gray-900 mb-1">Data Completeness</h3>
            <p className="text-xs text-gray-500 mb-3">Coverage across personal_data and ai_data branches.</p>
            <UserDataRadar data={profile.dataCompleteness} variant="completeness" showAxis />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-sm text-gray-900 mb-1">Persona Profile</h3>
            <p className="text-xs text-gray-500 mb-3">Synthesized from ai_data character / values / taste.</p>
            <UserDataRadar data={profile.personaProfile} variant="persona" showAxis />
          </div>
        </section>

        {/* Gut Check Analyze */}
        <AnalyzePanel userId={profile.id} userName={profile.displayName} isDemo={profile.id.startsWith('demo:')} />

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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-sm text-gray-900 mb-3">{title}</h3>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b last:border-0 border-gray-100 py-1.5">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 text-right truncate">{value}</dd>
    </div>
  );
}
