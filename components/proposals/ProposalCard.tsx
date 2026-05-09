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
  headline, body, scenarioName, scenarioType, isLive, size = 'md', className,
}: ProposalCardProps) {
  if (isLive) {
    const dims =
      size === 'lg'
        ? 'w-[260px] h-[500px]'
        : size === 'sm'
        ? 'w-[180px] h-[340px]'
        : 'w-[220px] h-[420px]';
    const headlineSize = size === 'lg' ? 'text-[20px]' : size === 'sm' ? 'text-[15px]' : 'text-[17px]';
    const bodySize = size === 'lg' ? 'text-[14px]' : size === 'sm' ? 'text-[12px]' : 'text-[13px]';
    return (
      <div
        className={cn(
          'relative bg-black rounded-[2rem] overflow-hidden border border-gray-800 flex flex-col justify-end shadow-2xl',
          dims,
          className,
        )}
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-700 rounded-full" />
        <div className="absolute top-2 right-6 text-[10px] text-gray-500 font-mono">9:41</div>
        <div className="p-5">
          {scenarioName && (
            <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 block">
              {scenarioType === 'warning' ? '⚠ ' : '✱ '}
              {scenarioName}
            </span>
          )}
          <p className={cn('text-white font-bold leading-tight mb-2', headlineSize)}>{headline}</p>
          <p className={cn('text-gray-300 leading-snug mb-4', bodySize)}>{body}</p>
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-transparent border border-white text-white text-[13px] px-5 py-2 rounded-full font-medium hover:bg-white hover:text-black transition-colors"
            >
              Go to Update
            </button>
          </div>
        </div>
      </div>
    );
  }
  // Compact list view
  return (
    <div className={cn('bg-gray-900 rounded-xl p-4 text-white', className)}>
      {scenarioName && (
        <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1.5">
          {scenarioName}
        </span>
      )}
      <p className="font-semibold text-sm">{headline}</p>
      <p className="text-gray-300 text-xs mt-1 leading-snug">{body}</p>
    </div>
  );
}
