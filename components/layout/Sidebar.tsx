'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ActivitySquare,
  Bell,
  Home,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { MorphMark } from '@/components/brand/MorphMark';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/app', label: 'Overview', icon: Home, note: 'Command view' },
  { href: '/demo', label: 'Live Demo', icon: ActivitySquare, note: 'Decision replay' },
  { href: '/users', label: 'People', icon: Users, note: 'Search Newnal' },
  { href: '/proposals', label: 'Pings', icon: Bell, note: 'Send history' },
  { href: '/scenarios', label: 'Patterns', icon: SlidersHorizontal, note: 'Signal telemetry' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="shrink-0 xl:sticky xl:top-0 xl:z-30 xl:h-screen xl:w-[290px]">
      <div className="flex h-full flex-col border-b border-white/[0.06] bg-[linear-gradient(180deg,rgba(7,17,31,0.92),rgba(9,20,37,0.88))] px-4 py-4 backdrop-blur-2xl xl:border-b-0 xl:border-r xl:px-5 xl:py-5">
        <div className="panel-soft mb-4 p-4">
          <div className="flex items-center gap-3">
            <MorphMark size="sm" />
            <div>
              <p className="font-display text-base font-semibold tracking-tight text-white">Gut Check</p>
              <p className="text-xs text-slate-400">Newnal decision guardian</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Calm on the surface, precise under the hood.
          </p>
        </div>

        <div className="mb-3 px-3 text-[11px] uppercase tracking-[0.24em] text-slate-500">
          Navigation
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin xl:block xl:space-y-2 xl:overflow-visible xl:pb-0">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex min-w-[180px] items-center gap-3 rounded-[20px] border px-3 py-3 transition-all duration-200 xl:min-w-0',
                  active
                    ? 'border-cyan-300/[0.22] bg-cyan-300/[0.08] shadow-[0_12px_36px_rgba(126,231,255,0.08)]'
                    : 'border-transparent bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.04]',
                )}
              >
                <div
                  className={cn(
                    'flex size-11 items-center justify-center rounded-2xl border transition-colors',
                    active
                      ? 'border-cyan-300/20 bg-cyan-300/[0.10] text-cyan-200'
                      : 'border-white/[0.08] bg-white/[0.04] text-slate-400 group-hover:text-white',
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className={cn('text-sm font-medium', active ? 'text-white' : 'text-slate-200')}>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500">{item.note}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 xl:mt-auto">
          {/* Dashboard-style status card keeps the shell feeling data-aware without adding fake sessions. */}
          <div className="panel-soft p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Agent posture</p>
            <div className="mt-4 space-y-3">
              <StatusRow label="Core engine" value="11 fixed rules" />
              <StatusRow label="Synthesis" value="WaveSpeed ready" />
              <StatusRow label="Delivery" value="Newnal Circle" />
            </div>
          </div>
          <p className="mt-4 px-2 text-[11px] text-slate-500">
            Stanford AI OS Hackathon · May 2026
          </p>
        </div>
      </div>
    </aside>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-100">{value}</span>
    </div>
  );
}
