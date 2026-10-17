import type { ReactNode } from 'react';
import type { Tone } from '@/utils/labels';

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
}

export function Badge({ tone = 'neutral', children, dot = true }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}`}>
      {dot && <span className="badge__dot" aria-hidden />}
      {children}
    </span>
  );
}

/** Small marker that makes demo-only content unmistakable. */
export function DemoTag({ label = 'Demo data' }: { label?: string }) {
  return <span className="demo-tag">{label}</span>;
}
