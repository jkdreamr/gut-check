import { cn } from '@/lib/utils';

interface ProposalCardProps {
  headline: string;
  body: string;
  scenarioName?: string;
  scenarioType?: 'warning' | 'nudge';
  isLive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProposalCard({
  headline,
  body,
  scenarioName,
  scenarioType,
  isLive,
  size = 'md',
  className,
}: ProposalCardProps) {
  if (isLive) {
    const dims =
      size === 'lg'
        ? 'w-[270px] h-[520px]'
        : size === 'sm'
          ? 'w-[188px] h-[348px]'
          : 'w-[228px] h-[432px]';
    const headlineSize = size === 'lg' ? 'text-[20px]' : size === 'sm' ? 'text-[15px]' : 'text-[17px]';
    const bodySize = size === 'lg' ? 'text-[14px]' : size === 'sm' ? 'text-[12px]' : 'text-[13px]';

    return (
      <div className={cn('relative', className)}>
        <div className="absolute inset-x-6 bottom-2 h-8 rounded-full bg-cyan-300/[0.18] blur-2xl" />
        {/* The phone preview keeps the dashboard precision, but softens the surface so the message feels humane. */}
        <div
          className={cn(
            'relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,#0a1324_0%,#101b30_52%,#0d1628_100%)] p-2 shadow-[0_30px_80px_rgba(1,10,24,0.45)]',
            dims,
          )}
        >
          <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(126,231,255,0.12),transparent_58%)]" />
          <div className="absolute left-1/2 top-3 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/14" />
          <div className="absolute right-6 top-2 text-[10px] font-mono text-slate-500">9:41</div>
          <div className="flex h-full flex-col rounded-[1.8rem] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-5">
            <div className="mt-8">
              {scenarioName && (
                <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                  {scenarioType === 'warning' ? 'Warning' : 'Nudge'} · {scenarioName}
                </span>
              )}
              <p className={cn('mt-4 font-display leading-tight text-white', headlineSize)}>
                {headline}
              </p>
              <p className={cn('mt-3 leading-6 text-slate-300', bodySize)}>{body}</p>
            </div>
            <div className="mt-auto rounded-[1.35rem] border border-white/[0.08] bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Gut Check</p>
              <button
                type="button"
                className="mt-3 inline-flex rounded-full border border-cyan-300/[0.22] bg-cyan-300/[0.08] px-4 py-2 text-[13px] font-medium text-cyan-100 transition hover:bg-cyan-300/[0.12]"
              >
                Open in Circle
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('panel-soft p-4 text-white', className)}>
      {scenarioName && (
        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
          {scenarioName}
        </span>
      )}
      <p className="mt-2 font-semibold text-white">{headline}</p>
      <p className="mt-1 text-xs leading-6 text-slate-300">{body}</p>
    </div>
  );
}
