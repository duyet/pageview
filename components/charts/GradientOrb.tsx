'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

interface GradientOrbProps {
  variant?: 'amber' | 'teal' | 'purple' | 'mixed';
  size?: number;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

const COLORS = {
  amber: '#D97706',
  teal: '#0F766E',
  purple: '#7C6FA0',
} as const;

export default function GradientOrb({
  variant = 'amber',
  size = 400,
  opacity = 0.15,
  className,
  style,
}: GradientOrbProps) {
  const id = useId();
  const r = size / 2;

  if (variant === 'mixed') {
    const offset = size * 0.2;
    return (
      <div
        className={cn('pointer-events-none absolute', className)}
        style={{ opacity, ...style }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id={`${id}-amber`}>
              <stop offset="0%" stopColor={COLORS.amber} stopOpacity={1} />
              <stop offset="100%" stopColor={COLORS.amber} stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${id}-teal`}>
              <stop offset="0%" stopColor={COLORS.teal} stopOpacity={1} />
              <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={r - offset / 2} cy={r} r={r} fill={`url(#${id}-amber)`} />
          <circle cx={r + offset / 2} cy={r} r={r} fill={`url(#${id}-teal)`} />
        </svg>
      </div>
    );
  }

  const color = COLORS[variant];

  return (
    <div
      className={cn('pointer-events-none absolute', className)}
      style={{ opacity, ...style }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`${id}-${variant}`}>
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={r} cy={r} r={r} fill={`url(#${id}-${variant})`} />
      </svg>
    </div>
  );
}
