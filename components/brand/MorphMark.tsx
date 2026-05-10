'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MorphMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
  glow?: boolean;
}

const SIZE_MAP = {
  sm: 'size-10',
  md: 'size-16',
  lg: 'size-24',
} as const;

export function MorphMark({
  size = 'md',
  className,
  animated = true,
  glow = true,
}: MorphMarkProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animated && !reduceMotion;

  return (
    <div className={cn('relative isolate grid place-items-center', SIZE_MAP[size], className)}>
      {/* Inspired by "Another AI Thing": the mark morphs softly instead of spinning like a generic loader. */}
      <motion.div
        aria-hidden
        className={cn(
          'absolute inset-0 rounded-[34%] bg-[linear-gradient(135deg,rgba(126,231,255,0.52),rgba(132,144,255,0.42),rgba(255,184,106,0.3))] blur-[10px]',
          glow ? 'opacity-95' : 'opacity-70',
        )}
        animate={shouldAnimate ? {
          rotate: [0, 18, -12, 0],
          scale: [1, 1.06, 0.98, 1],
          borderRadius: ['34% 66% 58% 42% / 36% 43% 57% 64%', '45% 55% 37% 63% / 52% 40% 60% 48%', '58% 42% 66% 34% / 45% 58% 42% 55%', '34% 66% 58% 42% / 36% 43% 57% 64%'],
        } : undefined}
        transition={{ duration: 8.5, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-[10%] rounded-[40%] border border-white/20 bg-white/[0.08] backdrop-blur-md"
        animate={shouldAnimate ? {
          rotate: [0, -24, 12, 0],
          scale: [1, 0.96, 1.04, 1],
          borderRadius: ['40% 60% 47% 53% / 43% 34% 66% 57%', '57% 43% 61% 39% / 52% 62% 38% 48%', '42% 58% 34% 66% / 60% 47% 53% 40%', '40% 60% 47% 53% / 43% 34% 66% 57%'],
        } : undefined}
        transition={{ duration: 7.2, repeat: Infinity, ease: [0.33, 1, 0.68, 1] }}
      />
      <motion.div
        className="absolute inset-[24%] rounded-[42%] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.92),rgba(126,231,255,0.8)_38%,rgba(132,144,255,0.5)_72%,rgba(132,144,255,0.08)_100%)] shadow-[0_0_30px_rgba(126,231,255,0.16)]"
        animate={shouldAnimate ? {
          scale: [1, 1.08, 0.94, 1],
          borderRadius: ['42% 58% 38% 62% / 42% 47% 53% 58%', '54% 46% 61% 39% / 38% 62% 38% 62%', '38% 62% 44% 56% / 56% 36% 64% 44%', '42% 58% 38% 62% / 42% 47% 53% 58%'],
        } : undefined}
        transition={{ duration: 5.4, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute inset-[39%] rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,0.45)]"
        animate={shouldAnimate ? { opacity: [0.82, 1, 0.76, 0.82], scale: [1, 1.18, 0.92, 1] } : undefined}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
