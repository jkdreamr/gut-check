'use client';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis,
} from 'recharts';
import type { RadarData } from '@/lib/types';

interface Props {
  data: RadarData;
  variant?: 'completeness' | 'persona';
  size?: number;
  showAxis?: boolean;
}

export function UserDataRadar({ data, variant = 'completeness', size, showAxis = false }: Props) {
  const rows = Object.entries(data).map(([k, v]) => ({ subject: k, value: Math.max(0, Math.min(1, v)) }));
  const fill = variant === 'completeness' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)';
  const stroke = variant === 'completeness' ? '#16a34a' : '#2563eb';
  const dotColor = variant === 'persona' ? stroke : undefined;
  const heightStyle = size ? { height: size, width: '100%' } : { height: 280, width: '100%' };
  return (
    <div style={heightStyle}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={rows} outerRadius="78%">
          <PolarGrid stroke="#e5e7eb" />
          {showAxis && (
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
          )}
          <PolarRadiusAxis tick={false} domain={[0, 1]} axisLine={false} />
          <Radar
            dataKey="value"
            stroke={stroke}
            fill={fill}
            strokeWidth={2}
            dot={dotColor ? { r: 2.5, fill: dotColor, strokeWidth: 0 } : false}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
