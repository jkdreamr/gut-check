import Link from 'next/link';
import type { NewnalUser } from '@/lib/types';
import { credibilityColor, initials, shortDid } from '@/lib/utils';
import { UserDataRadar } from './UserDataRadar';

interface Props {
  user: NewnalUser;
}

export function UserCard({ user }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-rose-200 hover:shadow-sm transition-all">
      <Link href={`/users/${encodeURIComponent(user.id)}`} className="block">
        <div className="flex items-start gap-3">
          <div className="size-12 shrink-0 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center text-rose-700 font-semibold">
            {initials(user.displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{user.displayName}</p>
            <p className="text-[11px] text-gray-400 font-mono truncate" title={user.id}>{shortDid(user.id)}</p>
            {user.matchReason && (
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{user.matchReason}</p>
            )}
          </div>
        </div>
        <div className="flex items-end justify-between mt-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Credibility</p>
            <p className={`text-xl font-semibold ${credibilityColor(user.credibilityScore)}`}>
              {user.credibilityScore}
            </p>
          </div>
          <div className="w-20 h-20">
            <UserDataRadar data={user.dataCompleteness} variant="completeness" size={80} />
          </div>
        </div>
        {user.matchScore !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-rose-500" style={{ width: `${user.matchScore}%` }} />
            </div>
            <span className="text-[11px] text-gray-500">{user.matchScore}</span>
          </div>
        )}
      </Link>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/users/${encodeURIComponent(user.id)}`}
          className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-black"
        >
          Analyst View
        </Link>
        <Link
          href={`/phone?did=${encodeURIComponent(user.id)}`}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Phone OS
        </Link>
      </div>
    </div>
  );
}
