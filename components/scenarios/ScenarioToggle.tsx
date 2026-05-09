'use client';
import { useState } from 'react';
import { scenarioBadgeClass } from '@/lib/utils';

interface Props {
  id: string;
  name: string;
  type: 'warning' | 'nudge';
  description: string;
  enabled: boolean;
  threshold: number;
  fired: number;
  accepted: number;
}

export function ScenarioToggle(props: Props) {
  const [enabled, setEnabled] = useState(props.enabled);
  const [threshold, setThreshold] = useState(props.threshold);
  const [saving, setSaving] = useState(false);

  async function persist(next: { enabled?: boolean; threshold?: number }) {
    setSaving(true);
    try {
      await fetch('/api/scenarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: props.id, ...next }),
      });
    } finally {
      setSaving(false);
    }
  }

  const acceptance = props.fired > 0 ? Math.round((props.accepted / props.fired) * 100) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase font-medium tracking-wider px-2 py-0.5 rounded-full ${scenarioBadgeClass(props.type)}`}>
              {props.type}
            </span>
            <p className="font-semibold text-sm text-gray-900">{props.name}</p>
          </div>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl">{props.description}</p>
        </div>
        <button
          type="button"
          aria-pressed={enabled}
          onClick={() => {
            const next = !enabled;
            setEnabled(next);
            persist({ enabled: next });
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            enabled ? 'bg-rose-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-400">Confidence threshold</p>
          <div className="flex items-center gap-3 mt-1">
            <input
              type="range"
              min={0} max={1} step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              onMouseUp={() => persist({ threshold })}
              onTouchEnd={() => persist({ threshold })}
              className="flex-1"
            />
            <span className="text-sm font-medium tabular-nums text-gray-700 w-10">
              {Math.round(threshold * 100)}%
            </span>
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-400">Times fired</p>
          <p className="text-sm font-semibold text-gray-900 mt-1.5">{props.fired}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-400">Acceptance rate</p>
          <p className="text-sm font-semibold text-gray-900 mt-1.5">{acceptance === null ? '—' : `${acceptance}%`}</p>
        </div>
      </div>
      {saving && <p className="text-[11px] text-gray-400 mt-3">Saving…</p>}
    </div>
  );
}
