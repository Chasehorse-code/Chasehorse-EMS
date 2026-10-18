import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'danger';
}

type NotifyInput = string | { title?: string; message: string; tone?: Toast['tone'] };

interface ToastContextValue {
  notify: (input: NotifyInput, tone?: Toast['tone']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback(
    (input: NotifyInput, toneArg: Toast['tone'] = 'success') => {
      const id = ++counter.current;
      let message = '';
      let tone: Toast['tone'] = toneArg;

      if (typeof input === 'string') {
        message = input;
      } else {
        message = input.title ? `${input.title}: ${input.message}` : input.message;
        if (input.tone) tone = input.tone;
      }

      setToasts((t) => [...t, { id, message, tone }]);
      timers.current.push(window.setTimeout(() => dismiss(id), 5000));
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            {t.tone === 'success' ? (
              <CheckCircle2 size={18} aria-hidden />
            ) : t.tone === 'danger' ? (
              <AlertTriangle size={18} aria-hidden />
            ) : (
              <Info size={18} aria-hidden />
            )}
            <span>{t.message}</span>
            <button type="button" className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              <X size={16} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
