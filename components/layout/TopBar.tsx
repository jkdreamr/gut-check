import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function TopBar({ title, subtitle, right }: TopBarProps) {
  return (
    <header className="px-8 py-5 border-b border-gray-200 bg-white flex items-start justify-between gap-6 sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}
