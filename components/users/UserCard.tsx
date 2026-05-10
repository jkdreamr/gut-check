import Link from 'next/link';
import type { NewnalUser } from '@/lib/types';
import { credibilityColor, initials, shortDid } from '@/lib/utils';
import { UserDataRadar } from './UserDataRadar';

interface Props {
  user: NewnalUser;
}

export function UserCard({ user }: Props) {
  return (
    <div className="panel-soft overflow-hidden p-5 transition duration-200 hover:border-cyan-300/[0.18] hover:bg-white/[0.08]">
      <Link href={`/users/${encodeURIComponent(user.id)}`} className="block">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(126,231,255,0.18),rgba(132,144,255,0.18))] text-sm font-semibold text-cyan-100">
            {initials(user.displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{user.displayName}</p>
            <p className="truncate font-mono text-[11px] text-slate-500" title={user.id}>
              {shortDid(user.id)}
            </p>
            {user.matchReason && (
              <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-300">{user.matchReason}</p>
            )}
          </div>
        </div>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="app-kicker">Credibility</p>
            <p className={`mt-1 text-2xl font-semibold ${credibilityColor(user.credibilityScore)}`}>
              {user.credibilityScore}
            </p>
          </div>
          <div className="panel-muted flex size-24 items-center justify-center p-2">
            <UserDataRadar data={user.dataCompleteness} variant="completeness" size={88} />
          </div>
        </div>
        {user.matchScore !== undefined && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <span>Search fit</span>
              <span>{user.matchScore}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,rgba(126,231,255,0.92),rgba(132,144,255,0.92))]"
                style={{ width: `${user.matchScore}%` }}
              />
            </div>
          </div>
        )}
      </Link>

      <div className="mt-5 flex items-center gap-2">
        <Link href={`/users/${encodeURIComponent(user.id)}`} className="app-button-primary px-4 py-2.5 text-xs">
          Open profile
        </Link>
        <Link href={`/demo?did=${encodeURIComponent(user.id)}`} className="app-button-secondary px-4 py-2.5 text-xs">
          Live demo
        </Link>
      </div>
    </div>
  );
}
