import Link from 'next/link';
import type { AtlasUser } from '@/lib/user-atlas';
import { credibilityColor, shortDid } from '@/lib/utils';

export function AtlasTable({ users }: { users: AtlasUser[] }) {
  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">
        No users surfaced from the atlas probes.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left">
              <Th>User</Th>
              <Th>Credibility</Th>
              <Th>Surfaces</Th>
              <Th>Match</Th>
              <Th>Probe clusters</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0 border-slate-100">
                <Td>
                  <div>
                    <p className="font-semibold text-slate-950">{user.displayName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{shortDid(user.id)}</p>
                  </div>
                </Td>
                <Td>
                  <span className={`font-semibold ${credibilityColor(user.credibilityScore)}`}>
                    {user.credibilityScore}
                  </span>
                </Td>
                <Td>{user.surfaces}</Td>
                <Td>{Math.round(user.matchScore ?? 0)}%</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {user.probeLabels.map((label) => (
                      <span key={label} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-600">
                        {label}
                      </span>
                    ))}
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/users/${encodeURIComponent(user.id)}`}
                      className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Analyst View
                    </Link>
                    <Link
                      href={`/phone?did=${encodeURIComponent(user.id)}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Phone OS
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}
