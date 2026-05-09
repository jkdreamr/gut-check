'use client';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from 'recharts';

interface Row {
  scenarioName: string;
  fired: number;
  accepted: number;
  type: 'warning' | 'nudge';
}

export function AcceptanceRateBar({ data }: { data: Row[] }) {
  const rows = data.map((d) => ({
    name: d.scenarioName,
    rate: d.fired > 0 ? Math.round((d.accepted / d.fired) * 100) : 0,
    type: d.type,
    fired: d.fired,
  }));
  return (
    <div className="w-full" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ left: 0, right: 24, top: 12, bottom: 12 }} layout="vertical">
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#374151' }} />
          <Tooltip
            cursor={{ fill: '#f9fafb' }}
            formatter={(value) => [`${Number(value)}%`, 'Acceptance']}
            labelStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="rate" radius={[0, 6, 6, 0]} barSize={14}>
            {rows.map((row, i) => (
              <Cell key={i} fill={row.type === 'warning' ? '#f59e0b' : '#22c55e'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
