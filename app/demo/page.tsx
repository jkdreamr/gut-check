// app/demo/page.tsx — full-screen split-view demo for live presentation.

import { LiveDemoPanel } from '@/components/demo/LiveDemoPanel';

export const dynamic = 'force-dynamic';

export default function DemoPage() {
  return <LiveDemoPanel />;
}
