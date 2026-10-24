import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, Briefcase, Building2, Loader2, ArrowLeft, Zap } from 'lucide-react';
import { useAuth, DEMO_PROFILES, type DemoRole } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { FormField } from '@/components/ui/FormField';
import { PasswordField } from '@/components/ui/PasswordField';
import { OtpInput } from '@/components/ui/OtpInput';
import type { Role } from '@/types';

export interface LoginViewProps {
  onSwitchView: (view: 'worker' | 'customer') => void;
  onClose: () => void;
  initialEmail?: string;
  initialMessage?: string | null;
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}••••${name.slice(-1)}@${domain}`;
}

export function LoginView({ onSwitchView, onClose, initialEmail = '', initialMessage = null }: LoginViewProps) {
  const { signIn, verifyEmailOtp, signInWithOtp, resetPassword, profile, refreshProfile, error: authError, signInAsDemo } = useAuth();
  const { setRole } = useRole();
  const navigate = useNavigate();

  const [step, setStep] = useState<'password' | 'otp' | 'forgot' | 'success'>('password');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Field validation and shaking states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(initialMessage);
  const [shakingField, setShakingField] = useState<'email' | 'password' | 'otp' | null>(null);

  const triggerShake = (field: 'email' | 'password' | 'otp') => {
    setShakingField(field);
    window.setTimeout(() => setShakingField(null), 500);
  };

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const validateEmail = (val: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim()) {
      setEmailError('Email address is required.');
      return false;
    }
    if (!emailRegex.test(val.trim())) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError('Password is required.');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const routeUserAfterAuth = (userProfile: any) => {
    setStep('success');
    window.setTimeout(() => {
      onClose();
      if (userProfile?.accountStatus === 'PENDING') {
        navigate('/pending-approval', { replace: true });
        return;
      }
      if (userProfile?.accountStatus === 'SUSPENDED' || userProfile?.accountStatus === 'REJECTED') {
        setGeneralError(`Account status is ${userProfile.accountStatus}. Please contact Operations.`);
        setStep('password');
        return;
      }

      const primaryRole = (userProfile?.roles?.[0] || 'employee').toLowerCase() as Role;
      setRole(primaryRole);

      if (primaryRole === 'admin' || primaryRole === 'operations_manager' || primaryRole === 'manager' || primaryRole === 'operations') {
        navigate('/overview', { replace: true });
      } else if (primaryRole === 'customer') {
        navigate('/customer/dashboard', { replace: true });
      } else {
        navigate('/employee/dashboard', { replace: true });
      }
    }, 1200);
  };

  const handleDemoLogin = async (demoKey: DemoRole) => {
    setLoading(true);
    setGeneralError(null);
    try {
      await signInAsDemo(demoKey);
      const demo = DEMO_PROFILES[demoKey];
      setStep('success');
      window.setTimeout(() => {
        onClose();
        navigate(demo.targetPath, { replace: true });
      }, 700);
    } catch {
      setGeneralError('Failed to initialize demo login.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setInfoMessage(null);

    const isEmailValid = validateEmail(email);
    const isPassValid = validatePassword(password);

    if (!isEmailValid) {
      triggerShake('email');
      return;
    }
    if (!isPassValid) {
      triggerShake('password');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Verify credentials with password
      await signIn(email.trim(), password);

      // Trigger OTP dispatch to email for two-factor verification
      try {
        await signInWithOtp(email.trim());
      } catch (otpErr) {
        console.warn('[Login] OTP dispatch fallback:', otpErr);
      }

      setInfoMessage(`Authentication code dispatched to ${maskEmail(email)}. Please check your inbox.`);
      setStep('otp');
      setCountdown(30);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please verify your email and password.';
      setGeneralError(msg);
      triggerShake('password');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    if (otpCode.length < 6) {
      triggerShake('otp');
      return;
    }

    setLoading(true);
    try {
      await verifyEmailOtp(email.trim(), otpCode.trim());
      const p = await refreshProfile();
      routeUserAfterAuth(p || profile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid OTP code. Please enter the latest 6-digit code sent to your email.';
      setGeneralError(msg);
      triggerShake('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setGeneralError(null);
    try {
      await signInWithOtp(email.trim());
      setInfoMessage(`A fresh verification OTP has been sent to ${email.trim()}.`);
      setCountdown(30);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend code. Please try again in a moment.';
      setGeneralError(msg);
    } finally {
      setResending(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    if (!validateEmail(email)) {
      triggerShake('email');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setInfoMessage('Password reset link has been dispatched to your email.');
      setStep('password');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset request failed.';
      setGeneralError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Success State Animation
  if (step === 'success') {
    return (
      <div className="auth-view auth-view--success" role="status" aria-live="polite">
        <div className="success-icon-wrapper">
          <div className="success-checkmark-circle">
            <CheckCircle2 size={54} className="success-checkmark-svg" />
          </div>
        </div>
        <h2 className="auth-view__title" style={{ marginTop: '1rem', color: 'var(--good)' }}>
          Authenticated Successfully
        </h2>
        <p className="auth-view__subtitle">
          Identity verified. Launching your ChaseHorse workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="auth-view">
      <div className="auth-view__header">
        <h2 id="auth-modal-title" className="auth-view__title">
          {step === 'password' && 'Sign In to ChaseHorse'}
          {step === 'otp' && 'Two-Factor Verification'}
          {step === 'forgot' && 'Reset Your Password'}
        </h2>
        <p className="auth-view__subtitle">
          {step === 'password' && 'Enter your registered credentials to access field operations.'}
          {step === 'otp' && `Enter the 6-digit verification code sent to ${maskEmail(email)}.`}
          {step === 'forgot' && 'Enter your email address and we will send a password reset link.'}
        </p>
      </div>

      {/* Inline Feedback Messages */}
      {(generalError || authError) && (
        <div className="auth-banner auth-banner--error" role="alert">
          <AlertCircle size={18} className="auth-banner__icon" />
          <span>{generalError || authError}</span>
        </div>
      )}

      {infoMessage && (
        <div className="auth-banner auth-banner--info" role="status">
          <CheckCircle2 size={18} className="auth-banner__icon" />
          <span>{infoMessage}</span>
        </div>
      )}

      {/* ⚡ Instant Demo Access (Evaluation Mode) */}
      {step === 'password' && (
        <div
          style={{
            margin: '0.25rem 0 1.25rem 0',
            padding: '1rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={15} color="#38bdf8" /> 1-Click Instant Demo Login
            </span>
            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
              No Credentials Needed
            </span>
          </div>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.775rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Select any persona to immediately explore their feature screens and test workflows:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleDemoLogin('operations')}
              disabled={loading}
              style={{
                padding: '10px 8px',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(56, 189, 248, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🛡️</span>
              <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#f8fafc' }}>Operations</span>
              <span style={{ fontSize: '0.675rem', color: '#38bdf8', fontWeight: 600 }}>Chaitanya</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('customer')}
              disabled={loading}
              style={{
                padding: '10px 8px',
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🏢</span>
              <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#f8fafc' }}>Customer</span>
              <span style={{ fontSize: '0.675rem', color: '#34d399', fontWeight: 600 }}>Liyana</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('employee')}
              disabled={loading}
              style={{
                padding: '10px 8px',
                borderRadius: '10px',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>⚡</span>
              <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#f8fafc' }}>Field Worker</span>
              <span style={{ fontSize: '0.675rem', color: '#fbbf24', fontWeight: 600 }}>Manu</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '0.85rem 0 0.25rem 0', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            <span style={{ fontSize: '0.675rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              or sign in with password & 2FA OTP
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          </div>
        </div>
      )}

      {/* Step 1: Email + Password Form */}
      {step === 'password' && (
        <form onSubmit={handlePasswordSubmit} noValidate className="auth-form">
          <FormField
            id="login-email"
            label="Email Address"
            required
            error={emailError}
            isShaking={shakingField === 'email'}
            icon={<Mail size={18} />}
          >
            <input
              id="login-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onBlur={() => validateEmail(email)}
              placeholder="name@enterprise.com"
              className="input input--with-icon"
              autoFocus
            />
          </FormField>

          <PasswordField
            id="login-password"
            name="password"
            label="Password"
            required
            value={password}
            onChange={(val) => {
              setPassword(val);
              if (passwordError) setPasswordError(null);
            }}
            onBlur={() => validatePassword(password)}
            error={passwordError}
            isShaking={shakingField === 'password'}
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => {
                  setStep('forgot');
                  setGeneralError(null);
                }}
                className="link-action-btn"
              >
                Forgot?
              </button>
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="btn btn--primary btn--block btn--sheen"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" /> Authenticating...
              </>
            ) : (
              <>
                Continue with email code <ArrowRight size={16} className="btn-arrow" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Step 2: 6-Box OTP Input */}
      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} noValidate className="auth-form">
          <div className="otp-container">
            <div className="otp-container__meta">
              <span className="otp-meta__email">Code sent to <strong>{maskEmail(email)}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setStep('password');
                  setOtpCode('');
                  setGeneralError(null);
                }}
                className="link-action-btn"
              >
                Change email
              </button>
            </div>

            <div className={shakingField === 'otp' ? 'form-field--shake' : ''}>
              <OtpInput
                value={otpCode}
                onChange={(code) => {
                  setOtpCode(code);
                  if (generalError) setGeneralError(null);
                }}
                disabled={loading}
              />
            </div>

            <div className="otp-resend-row">
              <span className="otp-resend-prompt">Didn’t receive your code?</span>
              <button
                type="button"
                disabled={countdown > 0 || resending}
                onClick={handleResendOtp}
                className="link-action-btn"
              >
                {resending ? 'Sending code...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length < 6}
            className="btn btn--primary btn--block btn--sheen"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" /> Verifying OTP...
              </>
            ) : (
              <>
                Verify & Enter Workspace <ArrowRight size={16} className="btn-arrow" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('password');
              setOtpCode('');
              setGeneralError(null);
            }}
            className="btn btn--ghost btn--block btn--sm"
          >
            <ArrowLeft size={14} /> Back to Password Entry
          </button>
        </form>
      )}

      {/* Step 3: Forgot Password Request */}
      {step === 'forgot' && (
        <form onSubmit={handleForgotPassword} noValidate className="auth-form">
          <FormField
            id="forgot-email"
            label="Registered Email"
            required
            error={emailError}
            isShaking={shakingField === 'email'}
            icon={<Mail size={18} />}
          >
            <input
              id="forgot-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onBlur={() => validateEmail(email)}
              placeholder="name@enterprise.com"
              className="input input--with-icon"
              autoFocus
            />
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className="btn btn--primary btn--block btn--sheen"
          >
            {loading ? <Loader2 size={18} className="spin" /> : 'Send Reset Link'}
          </button>

          <button
            type="button"
            onClick={() => setStep('password')}
            className="btn btn--ghost btn--block btn--sm"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        </form>
      )}

      {/* Switch to Registration Pick Cards */}
      <div className="auth-switch-cards">
        <div className="auth-switch-cards__divider">
          <span>New to ChaseHorse?</span>
        </div>
        <div className="auth-switch-cards__grid">
          <button
            type="button"
            onClick={() => onSwitchView('worker')}
            className="auth-pick-card"
          >
            <div className="auth-pick-card__icon auth-pick-card__icon--worker">
              <Briefcase size={20} />
            </div>
            <div className="auth-pick-card__content">
              <span className="auth-pick-card__title">On-Field Worker</span>
              <span className="auth-pick-card__sub">Perform tasks & earn rewards</span>
            </div>
            <ArrowRight size={14} className="auth-pick-card__arrow" />
          </button>

          <button
            type="button"
            onClick={() => onSwitchView('customer')}
            className="auth-pick-card"
          >
            <div className="auth-pick-card__icon auth-pick-card__icon--customer">
              <Building2 size={20} />
            </div>
            <div className="auth-pick-card__content">
              <span className="auth-pick-card__title">Business Customer</span>
              <span className="auth-pick-card__sub">Post field tasks nationwide</span>
            </div>
            <ArrowRight size={14} className="auth-pick-card__arrow" />
          </button>
        </div>
      </div>
    </div>
  );
}
