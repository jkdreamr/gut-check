'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';

export function AgentShell({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <AmbientBackdrop variant="app" />
      <div className="relative flex min-h-screen flex-col xl:flex-row">
        <Sidebar />
        {/* The app shell uses a cleaner dashboard rhythm so the analytical surfaces feel precise and trustworthy. */}
        <motion.div
          className="min-w-0 flex-1"
          initial={reduceMotion ? false : { opacity: 0, y: 14, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
