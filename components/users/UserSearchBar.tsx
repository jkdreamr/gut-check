'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

const SUGGESTIONS = [
  'Find me people who like Korean food',
  'Anyone near a gym in California',
  'Users in their thirties exploring fitness goals',
  'People with a tech / electronics shopping pattern',
  'All users with rich profile data',
];

export function UserSearchBar({ initial }: { initial?: string }) {
  const [q, setQ] = useState(initial ?? '');
  const router = useRouter();

  function go(query: string) {
    router.push(`/users?q=${encodeURIComponent(query)}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    go(q.trim());
  }

  return (
    <div className="panel-elevated p-5 sm:p-6">
      <div className="mb-5">
        <p className="app-kicker">Live discovery</p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-white">
          Describe the kind of person you want to inspect
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Newnal handles the search. Gut Check handles the judgment after you open the person.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 lg:flex-row">
        <label className="relative block flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find me people who..."
            className="app-input pl-11"
          />
        </label>
        <button type="submit" className="app-button-primary">
          Search Newnal
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQ(s);
              go(s);
            }}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-slate-300 transition hover:border-cyan-300/25 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
