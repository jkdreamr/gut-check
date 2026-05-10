'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { MorphMark } from '@/components/brand/MorphMark';

interface ThinkingStateProps {
  title: string;
  body: string;
  compact?: boolean;
}

export function ThinkingState({
  title,
  body,
  compact = false,
}: ThinkingStateProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`panel-muted flex items-center gap-4 ${compact ? 'px-4 py-3' : 'px-5 py-5'}`}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* The morphing mark doubles as a humane thinking state, so processing feels alive rather than mechanical. */}
      <MorphMark size={compact ? 'sm' : 'md'} glow={false} />
      <div>
        <p className="font-display text-lg tracking-tight text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">{body}</p>
      </div>
    </motion.div>
  );
}
