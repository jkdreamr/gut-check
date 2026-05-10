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
  const fill = variant === 'completeness' ? 'rgba(126,231,255,0.22)' : 'rgba(154,132,255,0.24)';
  const stroke = variant === 'completeness' ? '#7ee7ff' : '#9a84ff';
  const dotColor = variant === 'persona' ? stroke : undefined;
  const heightStyle = size ? { height: size, width: '100%' } : { height: 280, width: '100%' };
  return (
    <div style={heightStyle}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={rows} outerRadius="78%">
          <PolarGrid stroke="rgba(255,255,255,0.10)" />
          {showAxis && (
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#8ea0bb' }} />
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
