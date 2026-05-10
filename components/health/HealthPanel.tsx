'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, ShieldAlert, Wrench } from 'lucide-react';

type CheckState = 'ready' | 'missing' | 'degraded' | 'error' | 'skipped';

interface CheckResult {
  state: CheckState;
  message: string;
}

interface HealthResponse {
  timestamp: string;
  probe: boolean;
  checks: Record<string, CheckResult>;
}

export function HealthPanel({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(probe = true) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/health?probe=${probe ? '1' : '0'}`, {
        cache: 'no-store',
      });
      const json = (await res.json()) as HealthResponse & { error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setData(json);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
  }, []);

  const entries = Object.entries(data?.checks ?? {});
  const readyCount = entries.filter(([, check]) => check.state === 'ready').length;

  if (compact) {
    return (
      <div className="panel-soft p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="app-kicker">System check</p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              Demo systems check
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              See whether Postgres, Newnal, and WaveSpeed are actually ready before you present.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            className="app-button-secondary px-3 py-2 disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Refresh'}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {entries.map(([key, check]) => (
            <StatusBadge key={key} label={key} state={check.state} />
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-rose-200">{error}</p>}
        {!error && data && (
          <p className="mt-3 text-sm text-slate-400">
            {readyCount} live checks passed. Last updated {new Date(data.timestamp).toLocaleTimeString()}.
          </p>
        )}
      </div>
    );
  }

  return (
    <section className="panel-soft p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="app-kicker">System check</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Service Agent health</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Gut Check stays demo-friendly even when keys or Postgres are missing, but this page tells you what is truly ready for a live judging run.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-cyan-300 hover:bg-slate-900 disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Run live probes
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[0.08] px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {entries.map(([key, check]) => (
          <div key={key} className="panel-muted p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {iconForState(check.state)}
                <p className="text-sm font-semibold capitalize text-white">{key}</p>
              </div>
              <StatusBadge label={check.state} state={check.state} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{check.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function iconForState(state: CheckState) {
  if (state === 'ready') return <ShieldCheck className="size-4 text-emerald-600" />;
  if (state === 'skipped') return <Wrench className="size-4 text-slate-500" />;
  return <ShieldAlert className="size-4 text-amber-600" />;
}

function StatusBadge({ label, state }: { label: string; state: CheckState }) {
  const tone =
    state === 'ready'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : state === 'skipped'
      ? 'border-slate-200 bg-slate-50 text-slate-600'
      : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${tone}`}>
      {label}
    </span>
  );
}
