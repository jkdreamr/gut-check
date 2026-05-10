'use client';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from 'recharts';

interface Row {
  scenarioName: string;
  fired: number;
  accepted: number;
  type: 'warning' | 'nudge';
  generated?: boolean;
}

export function AcceptanceRateBar({ data }: { data: Row[] }) {
  const rows = data.map((d) => ({
    name: d.generated ? `${d.scenarioName} *` : d.scenarioName,
    rate: d.fired > 0 ? Math.round((d.accepted / d.fired) * 100) : 0,
    type: d.type,
    fired: d.fired,
    generated: Boolean(d.generated),
  }));
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) {
    return <div className="w-full" style={{ height: 280 }} aria-hidden />;
  }
  return (
    <div className="w-full" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ left: 0, right: 24, top: 12, bottom: 12 }} layout="vertical">
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#8ea0bb' }} />
          <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11, fill: '#d8e1ee' }} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{
              background: 'rgba(12, 23, 42, 0.96)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              color: '#f4f7fb',
            }}
            formatter={(value, _name, item) => {
              const payload = item?.payload as { generated?: boolean; fired?: number } | undefined;
              return [
                `${Number(value)}%${payload?.generated ? ' · generated pattern' : ''}`,
                payload?.fired ? `${payload.fired} sent` : 'Acceptance',
              ];
            }}
            labelStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="rate" radius={[0, 6, 6, 0]} barSize={14}>
            {rows.map((row, i) => (
              <Cell
                key={i}
                fill={
                  row.generated
                    ? row.type === 'warning'
                      ? '#ffb86a'
                      : '#9a84ff'
                    : row.type === 'warning'
                      ? '#f59e0b'
                      : '#22c55e'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
