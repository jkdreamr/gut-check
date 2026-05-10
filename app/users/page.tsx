// app/users/page.tsx — Personal AI Universe browser.

import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { UserCard } from '@/components/users/UserCard';
import { UserSearchBar } from '@/components/users/UserSearchBar';
import { discoverUsers } from '@/lib/newnal';
import { adaptUserSummary } from '@/lib/synthesize';

export const dynamic = 'force-dynamic';

interface SearchProps {
  searchParams: Promise<{ q?: string }> | { q?: string };
}

export default async function UsersPage({ searchParams }: SearchProps) {
  const params = await Promise.resolve(searchParams);
  const q = params?.q || 'all users with rich profile data';
  let users = [] as ReturnType<typeof adaptUserSummary>[];
  let error: string | undefined;
  try {
    const real = await discoverUsers(q);
    users = real.map(adaptUserSummary);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main>
      <TopBar
        title="Personal AI Universe"
        subtitle="Search the live Newnal Plaza by natural language and open a user to let autopilot inspect them."
        right={(
          <Link
            href="/demo"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Open demo
          </Link>
        )}
      />
      <div className="px-8 py-8 space-y-6">
        <UserSearchBar initial={q} />
        {error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">
            Newnal API error: {error}
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500">
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
