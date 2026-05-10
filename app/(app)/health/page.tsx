import { TopBar } from '@/components/layout/TopBar';
import { HealthPanel } from '@/components/health/HealthPanel';

export const dynamic = 'force-dynamic';

export default function HealthPage() {
  return (
    <main>
      <TopBar
        title="System check"
        subtitle="A quiet setup page for checking Postgres, Newnal, and WaveSpeed."
      />
      <div className="px-8 py-8">
        <HealthPanel />
      </div>
    </main>
  );
}
