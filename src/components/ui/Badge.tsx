import type { ReactNode } from 'react';
import type { Tone } from '@/utils/labels';

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ tone = 'neutral', children, dot = true, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge--${tone} ${className}`}>
      {dot && <span className="badge__dot" aria-hidden />}
      {children}
    </span>
  );
}

/**
 * Retained for backwards-compatibility; returns null so no fake demo badges appear.
 */
export function DemoTag(_props?: { label?: string }) {
  return null;
}
