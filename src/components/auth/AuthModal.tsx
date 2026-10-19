import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Shield } from 'lucide-react';
import { LoginView } from './LoginView';
import { WorkerRegisterView } from './WorkerRegisterView';
import { CustomerRegisterView } from './CustomerRegisterView';

export type AuthModalView = 'login' | 'worker' | 'customer';

export interface AuthModalProps {
  isOpen: boolean;
  initialView?: AuthModalView;
  onClose: () => void;
  initialMessage?: string | null;
}

export function AuthModal({
  isOpen,
  initialView = 'login',
  onClose,
  initialMessage = null,
}: AuthModalProps) {
  const [view, setView] = useState<AuthModalView>(initialView);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'none'>('none');
  const [isClosing, setIsClosing] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Sync initial view when modal is opened
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setIsClosing(false);
      setSlideDirection('none');
    }
  }, [isOpen, initialView]);

  // Lock body scroll and manage focus trapping
  useEffect(() => {
    if (!isOpen) return;

    // Remember trigger element to return focus on close
    triggerElementRef.current = document.activeElement as HTMLElement;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Auto-focus inside dialog
    const timer = window.setTimeout(() => {
      if (dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 50);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    // Allow 350ms reverse animation
    const timer = window.setTimeout(() => {
      setIsClosing(false);
      onClose();
      triggerElementRef.current?.focus();
    }, 320);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  // Keyboard navigation: Escape key & focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!dialogRef.current) return;
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const handleSwitchView = (nextView: AuthModalView) => {
    if (nextView === view) return;
    const viewOrder: Record<AuthModalView, number> = {
      login: 0,
      worker: 1,
      customer: 2,
    };
    const direction = viewOrder[nextView] > viewOrder[view] ? 'left' : 'right';
    setSlideDirection(direction);
    setView(nextView);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`auth-modal-portal ${isClosing ? 'auth-modal-portal--closing' : 'auth-modal-portal--open'}`}
      role="presentation"
    >
      {/* Backdrop with blur */}
      <div
        className="auth-modal-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Centered Modal Dialog Shell */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className={`auth-modal-dialog ${isClosing ? 'auth-modal-dialog--closing' : 'auth-modal-dialog--enter'}`}
        tabIndex={-1}
      >
        {/* Header Bar with Badge and Close X */}
        <div className="auth-modal-dialog__topbar">
          <div className="auth-modal-brand-badge">
            <div className="auth-modal-brand-badge__icon">
              <Shield size={16} />
            </div>
            <span>CHASEHORSE FIELD OPS</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="auth-modal-close-btn"
            aria-label="Close dialog"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal View Switcher Navigation Tabs */}
        <div className="auth-modal-nav-tabs" role="tablist" aria-label="Authentication Options">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'login'}
            onClick={() => handleSwitchView('login')}
            className={`auth-modal-tab ${view === 'login' ? 'auth-modal-tab--active' : ''}`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'worker'}
            onClick={() => handleSwitchView('worker')}
            className={`auth-modal-tab ${view === 'worker' ? 'auth-modal-tab--active' : ''}`}
          >
            Join as Worker
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'customer'}
            onClick={() => handleSwitchView('customer')}
            className={`auth-modal-tab ${view === 'customer' ? 'auth-modal-tab--active' : ''}`}
          >
            Post Tasks (Customer)
          </button>
        </div>

        {/* Animated View Container */}
        <div className="auth-modal-content-viewport">
          <div
            key={view}
            className={`auth-modal-view-slide auth-modal-view-slide--${slideDirection}`}
          >
            {view === 'login' && (
              <LoginView
                onSwitchView={(v) => handleSwitchView(v)}
                onClose={handleClose}
                initialMessage={initialMessage}
              />
            )}
            {view === 'worker' && (
              <WorkerRegisterView
                onSwitchView={(v) => handleSwitchView(v)}
                onClose={handleClose}
              />
            )}
            {view === 'customer' && (
              <CustomerRegisterView
                onSwitchView={(v) => handleSwitchView(v)}
                onClose={handleClose}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
