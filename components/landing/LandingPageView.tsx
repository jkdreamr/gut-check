'use client';

import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { ArrowRight, BrainCircuit, MapPin, ShieldCheck } from 'lucide-react';
import { MorphMark } from '@/components/brand/MorphMark';
import { HeroVideoStage } from '@/components/landing/HeroVideoStage';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';

const smoothEase = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: smoothEase },
  },
};

export function LandingPageView() {
  const reduceMotion = useReducedMotion();
  const marketingVideoUrl = process.env.NEXT_PUBLIC_MARKETING_VIDEO_URL || '/marketing/gut-check-ad.mp4';
  const marketingPosterUrl = process.env.NEXT_PUBLIC_MARKETING_VIDEO_POSTER_URL;

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <AmbientBackdrop variant="landing" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <motion.header
          className="flex items-center justify-between gap-4 py-3"
          initial={reduceMotion ? false : 'hidden'}
          animate="visible"
          variants={fadeUp}
        >
          <div className="flex items-center gap-3">
            <MorphMark size="sm" />
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-white">Gut Check</p>
              <p className="text-sm text-slate-400">A Newnal decision guardian</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/demo" className="app-button-secondary">
              See the live flow
            </Link>
            <Link href="/app" className="app-button-primary">
              Try the agent
            </Link>
          </div>
        </motion.header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.94fr)] lg:py-16">
          <motion.section
            initial={reduceMotion ? false : 'hidden'}
            animate="visible"
            variants={fadeUp}
            className="max-w-3xl"
          >
            <div className="mb-6 flex flex-wrap gap-2">
              <Pill icon={<ShieldCheck className="size-3.5" />} label="Built for moments of hesitation" />
              <Pill icon={<MapPin className="size-3.5" />} label="Location-aware" />
              <Pill icon={<BrainCircuit className="size-3.5" />} label="AI that knows when to stay quiet" />
            </div>
            <div className="mb-8">
              <MorphMark size="lg" className="mb-7" />
              <h1 className="font-display text-balance text-5xl tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                A calm pause before a costly impulse.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Gut Check reads context, history, and timing in one glance. When the case is strong, it sends one human warning through Newnal. When the case is weak, it lets the moment pass.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/app" className="app-button-primary">
                Try it out
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/demo" className="app-button-secondary">
                Watch the live demo
              </Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <SignalCard
                title="Reads the moment"
                body="Payment intent, location, habits, and social signal get fused into one decision surface."
              />
              <SignalCard
                title="Decides carefully"
                body="The agent scores the interrupt before it earns the right to send anything at all."
              />
              <SignalCard
                title="Pings the real phone"
                body="When the answer is yes, the warning goes out through Newnal Circle."
              />
            </div>
          </motion.section>

          <motion.section
          initial={reduceMotion ? false : { opacity: 0, x: 28, filter: 'blur(10px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.72, ease: smoothEase, delay: reduceMotion ? 0 : 0.12 }}
        >
            {/* This stage is intentionally durable: later you can swap the placeholder for a real ad cut without redesigning the hero. */}
            <HeroVideoStage
              videoSrc={marketingVideoUrl}
              posterSrc={marketingPosterUrl}
            />
          </motion.section>
        </div>
      </div>
    </main>
  );
}

function Pill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="app-pill">
      {icon}
      {label}
    </span>
  );
}

function SignalCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel-soft p-5">
      <p className="font-display text-xl tracking-tight text-white">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
    </div>
  );
}
