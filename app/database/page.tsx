import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { AtlasTable } from '@/components/users/AtlasTable';
import { discoverUserAtlas } from '@/lib/user-atlas';

export const dynamic = 'force-dynamic';

export default async function DatabasePage() {
  let error: string | undefined;
  let users = [] as Awaited<ReturnType<typeof discoverUserAtlas>>['users'];
  let probesUsed = 0;

  try {
    const atlas = await discoverUserAtlas();
    users = atlas.users;
    probesUsed = atlas.probesUsed;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <main>
      <TopBar
        title="User Atlas"
        subtitle="A unioned live snapshot of the Newnal Plaza, stitched together from multiple broad probes so you can browse the full surface area instead of one search result at a time."
        right={(
          <>
            <Link
              href="/users"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Search View
            </Link>
            <Link
              href="/phone"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-slate-900"
            >
              Phone OS
            </Link>
          </>
        )}
      />
      <div className="px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Metric label="Users surfaced" value={users.length.toString()} sub="deduped by DID" />
          <Metric label="Atlas probes" value={probesUsed.toString()} sub="broad discovery sweeps" />
          <Metric label="Top surface depth" value={(users[0]?.surfaces ?? 0).toString()} sub="probe clusters on best-covered user" />
          <Metric label="Experience" value="Live" sub="not a static mock dataset" />
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-amber-50 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-700">Why this exists</p>
              <p className="mt-2 text-slate-700 max-w-3xl">
                Newnal exposes discovery through search, not a direct list-all endpoint. The atlas approximates the whole visible universe by issuing multiple broad live discovery passes and merging the results into one browsable database snapshot.
              </p>
            </div>
            <Link
              href="/users?q=all%20users%20with%20rich%20profile%20data"
              className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Re-run canonical search
            </Link>
          </div>
        </section>

        {error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">
            Newnal API error: {error}
          </div>
        ) : (
          <AtlasTable users={users} />
        )}
      </div>
    </main>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-3xl font-semibold text-slate-950 mt-2">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}
