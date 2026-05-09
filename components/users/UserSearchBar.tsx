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
    <div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find me people who…"
            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-rose-300"
          />
        </div>
        <button
          type="submit"
          className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg"
        >
          Search Plaza
        </button>
      </form>
      <div className="flex flex-wrap gap-2 mt-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQ(s);
              go(s);
            }}
            className="text-[11px] text-gray-600 bg-white border border-gray-200 hover:border-rose-300 hover:text-rose-700 rounded-full px-3 py-1"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
