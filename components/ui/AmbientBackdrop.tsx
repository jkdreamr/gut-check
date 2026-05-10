'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AmbientBackdropProps {
  variant?: 'landing' | 'app';
  className?: string;
}

export function AmbientBackdrop({
  variant = 'app',
  className,
}: AmbientBackdropProps) {
  const reduceMotion = useReducedMotion();
  const landing = variant === 'landing';

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {/* Inspired by "Sense": a slow aura field makes the product feel reflective instead of mechanical. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(126,231,255,0.16),transparent_22%),radial-gradient(circle_at_82%_18%,rgba(154,132,255,0.14),transparent_24%),radial-gradient(circle_at_78%_84%,rgba(255,184,106,0.12),transparent_24%)]" />
      <motion.div
        className={cn(
          'absolute -left-24 top-10 h-72 w-72 rounded-full blur-[110px]',
          landing ? 'bg-cyan-400/[0.22]' : 'bg-cyan-400/[0.14]',
        )}
        animate={reduceMotion ? undefined : { x: [0, 24, -16, 0], y: [0, -18, 10, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: [0.33, 1, 0.68, 1] }}
      />
      <motion.div
        className={cn(
          'absolute right-0 top-16 h-80 w-80 rounded-full blur-[130px]',
          landing ? 'bg-violet-400/20' : 'bg-indigo-400/[0.12]',
        )}
        animate={reduceMotion ? undefined : { x: [0, -26, 20, 0], y: [0, 14, -12, 0], scale: [1, 0.92, 1.06, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className={cn(
          'absolute bottom-[-6rem] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-[150px]',
          landing ? 'bg-amber-300/[0.16]' : 'bg-amber-300/10',
        )}
        animate={reduceMotion ? undefined : { y: [0, -18, 12, 0], scale: [1, 1.06, 0.96, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: [0.33, 1, 0.68, 1] }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.12),rgba(7,17,31,0.38)_52%,rgba(7,17,31,0.8)_100%)]" />
    </div>
  );
}
