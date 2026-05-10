import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function TopBar({ title, subtitle, right }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[rgba(7,17,31,0.72)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="app-kicker">Gut Check agent</p>
          <h1 className="app-title mt-2 text-3xl font-semibold text-white sm:text-[2rem]">{title}</h1>
          {subtitle && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
