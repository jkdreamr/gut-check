'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Users, Bell, SlidersHorizontal, Play, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/proposals', label: 'Proposals', icon: Bell },
  { href: '/scenarios', label: 'Scenarios', icon: SlidersHorizontal },
  { href: '/demo', label: 'Demo Mode', icon: Play },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100 flex items-center gap-2">
        <div className="size-8 rounded-lg bg-rose-500 text-white flex items-center justify-center">
          <Sparkles className="size-4" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none">The Gut Check</p>
          <p className="text-[11px] text-gray-500 mt-1">Newnal Service Agent</p>
        </div>
      </div>
      <nav className="p-3 flex-1 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-rose-50 text-rose-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-gray-100 text-[11px] text-gray-500">
        Hackathon submission · May 9–10 2026
      </div>
    </aside>
  );
}
