import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Info } from 'lucide-react';
import type { AsyncState } from '@/hooks/useAsync';
import { Button } from './Button';

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton" role="status" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="skeleton__line" style={{ width: `${92 - i * 14}%` }} />
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <Inbox size={28} aria-hidden />
      <p className="empty__title">{title}</p>
      {description && <p className="empty__desc">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="empty empty--error" role="alert">
      <AlertTriangle size={28} aria-hidden />
      <p className="empty__title">Couldn’t load this data</p>
      <p className="empty__desc">{message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/** Renders loading / error / content for an AsyncState. */
export function Async<T>({ state, children, skeletonLines = 4 }: {
  state: AsyncState<T>;
  children: (data: T) => ReactNode;
  skeletonLines?: number;
}) {
  if (state.error && state.data === undefined) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (state.data === undefined) return <Skeleton lines={skeletonLines} />;
  return <>{children(state.data)}</>;
}

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warning' | 'ai'; title?: string; children: ReactNode }) {
  return (
    <div className={`notice notice--${tone}`} role="note">
      <Info size={18} aria-hidden className="notice__icon" />
      <div>
        {title && <p className="notice__title">{title}</p>}
        <div className="notice__body">{children}</div>
      </div>
    </div>
  );
}
