// app/users/page.tsx — Personal AI Universe browser.

import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { UserCard } from '@/components/users/UserCard';
import { UserSearchBar } from '@/components/users/UserSearchBar';
import { discoverUsers } from '@/lib/newnal';
import { adaptUserSummary } from '@/lib/synthesize';

export const dynamic = 'force-dynamic';

const DEFAULT_QUERY = 'all users with rich profile data';

interface SearchProps {
  searchParams: Promise<{ q?: string }> | { q?: string };
}

export default async function UsersPage({ searchParams }: SearchProps) {
  const params = await Promise.resolve(searchParams);
  const q = params?.q || DEFAULT_QUERY;
  let users = [] as ReturnType<typeof adaptUserSummary>[];
  let error: string | undefined;
  try {
    const real = await discoverUsers(
      q,
      q === DEFAULT_QUERY
        ? { revalidate: 45, tags: ['people-default-search'] }
        : undefined,
    );
    users = real.map(adaptUserSummary);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main>
      <TopBar
        title="People"
        subtitle="Search Newnal in plain English, open a person, and let Gut Check decide whether a ping is worth sending."
        right={(
          <Link
            href="/demo"
            className="app-button-secondary px-4 py-2.5"
          >
            Open demo
          </Link>
        )}
      />
      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 space-y-6">
        <UserSearchBar initial={q} />
        {error ? (
          <div className="panel-muted border-rose-300/20 bg-rose-300/[0.08] p-4 text-sm text-rose-100">
            Newnal API error: {error}
          </div>
        ) : users.length === 0 ? (
          <div className="panel-soft p-12 text-center text-sm text-slate-400">
            No matches. Try a different query.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
