import { NextResponse, type NextRequest } from 'next/server';
import { explainDatabaseIssue, hasValidPostgresDatabaseUrl } from '@/lib/database';
import { searchPersonalAis } from '@/lib/newnal';
import { hasWaveSpeed, waveSpeedJson, waveSpeedModel } from '@/lib/wavespeed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckState = 'ready' | 'missing' | 'degraded' | 'error' | 'skipped';

interface CheckResult {
  state: CheckState;
  message: string;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const probe = url.searchParams.get('probe') === '1';

  const checks: Record<string, CheckResult> = {
    database: {
      state: hasValidPostgresDatabaseUrl() ? 'skipped' : 'missing',
      message: hasValidPostgresDatabaseUrl()
        ? 'Postgres URL configured. Reachability probe skipped.'
        : 'DATABASE_URL is missing or still points at SQLite.',
    },
    newnal: {
      state: process.env.NEWNAL_API_KEY?.trim() ? 'skipped' : 'missing',
      message: process.env.NEWNAL_API_KEY?.trim()
        ? 'NEWNAL_API_KEY configured. Live probe skipped.'
        : 'NEWNAL_API_KEY is missing. Demo mode will still work.',
    },
    wavespeed: {
      state: hasWaveSpeed() ? 'skipped' : 'missing',
      message: hasWaveSpeed()
        ? `WAVESPEED_API_KEY configured for ${waveSpeedModel()}. Live probe skipped.`
        : 'WAVESPEED_API_KEY is missing. Gut Check will fall back to deterministic copy.',
    },
    anthropic: {
      state: process.env.ANTHROPIC_API_KEY?.trim() ? 'ready' : 'missing',
      message: process.env.ANTHROPIC_API_KEY?.trim()
        ? 'Anthropic fallback is configured.'
        : 'Anthropic fallback is optional and currently not configured.',
    },
  };

  if (probe) {
    if (hasValidPostgresDatabaseUrl()) {
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.$queryRawUnsafe('SELECT 1');
        checks.database = {
          state: 'ready',
          message: 'Postgres responded successfully.',
        };
      } catch (error) {
        checks.database = {
          state: 'error',
          message: explainDatabaseIssue(error),
        };
      }
    }

    if (process.env.NEWNAL_API_KEY?.trim()) {
      try {
        const result = await searchPersonalAis('Find me people who like Korean food');
        checks.newnal = {
          state: 'ready',
          message: `Newnal reachable. Search returned ${result.personal_ai.length} users.`,
        };
      } catch (error) {
        checks.newnal = {
          state: 'error',
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }

    if (hasWaveSpeed()) {
      try {
        const result = await waveSpeedJson<{ ok?: boolean }>({
          system: 'Return valid JSON only.',
          prompt: 'Reply with {"ok":true}.',
          temperature: 0,
          maxTokens: 40,
        });
        checks.wavespeed = {
          state: result.ok ? 'ready' : 'degraded',
          message: result.ok
            ? `WaveSpeed reachable with model ${waveSpeedModel()}.`
            : 'WaveSpeed responded, but the probe payload was unexpected.',
        };
      } catch (error) {
        checks.wavespeed = {
          state: 'error',
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    probe,
    checks,
  });
}
