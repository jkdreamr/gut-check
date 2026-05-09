// lib/utils.ts — small shared utilities.
import type { ClassValue } from 'clsx';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs));
}

export function shortDid(did: string): string {
  if (did.length <= 24) return did;
  return `${did.slice(0, 14)}…${did.slice(-6)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

export function credibilityColor(score: number): string {
  if (score >= 700) return 'text-emerald-600';
  if (score >= 400) return 'text-amber-600';
  return 'text-rose-600';
}

export function scenarioBadgeClass(type: 'warning' | 'nudge'): string {
  return type === 'warning'
    ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border border-emerald-200';
}
