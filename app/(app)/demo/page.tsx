import { LiveDemoPanel } from '@/components/demo/LiveDemoPanel';
import { deriveLikelyDecisionMoments } from '@/lib/decision-moments';
import { loadUserProfile } from '@/lib/profile-loader';

export const dynamic = 'force-dynamic';

interface SearchProps {
  searchParams: Promise<{ did?: string }> | { did?: string };
}

export default async function DemoPage({ searchParams }: SearchProps) {
  const params = await Promise.resolve(searchParams);
  const did = params?.did ? decodeURIComponent(params.did) : undefined;

  if (!did) {
    return <LiveDemoPanel />;
  }

  const { profile, error } = await loadUserProfile(did);
  if (!profile) {
    return <LiveDemoPanel initialError={error ?? 'Could not load that person.'} />;
  }

  return (
    <LiveDemoPanel
      initialLiveTarget={{
        id: profile.id,
        name: profile.displayName,
        label: `${profile.profileSnapshot.age} · ${profile.profileSnapshot.location}`,
        contextLine: `${profile.profileSnapshot.persona} · ${profile.profileSnapshot.goal}`,
        source: profile.id.startsWith('demo:') ? 'demo' : 'live',
        moments: deriveLikelyDecisionMoments(profile).slice(0, 4),
      }}
    />
  );
}
