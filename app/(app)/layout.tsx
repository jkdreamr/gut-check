import type { ReactNode } from 'react';
import { AgentShell } from '@/components/layout/AgentShell';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AgentShell>{children}</AgentShell>;
}
