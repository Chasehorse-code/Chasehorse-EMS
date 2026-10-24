import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Lock, Mail, KeyRound, AlertCircle, CheckCircle2, ArrowRight, Briefcase, Building2, Zap } from 'lucide-react';
import { useAuth, DEMO_PROFILES, type DemoRole } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import type { Role } from '@/types';

export function LoginPage() {
  const { signIn, verifyEmailOtp, signInWithOtp, resetPassword, profile, refreshProfile, error: authError, signInAsDemo } = useAuth();
  const { setRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<'password' | 'otp' | 'forgot'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Check if routed with message in location state
  useEffect(() => {
    const st = location.state as { message?: string } | null;
    if (st?.message) {
      setInfoMessage(st.message);
    }
  }, [location.state]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const routeUserAfterAuth = (userProfile: any) => {
    if (userProfile?.accountStatus === 'PENDING') {
      navigate('/pending-approval', { replace: true });
      return;
    }
    if (userProfile?.accountStatus === 'SUSPENDED' || userProfile?.accountStatus === 'REJECTED') {
      setLocalError(`Account status is ${userProfile.accountStatus}. Please contact Operations.`);
      return;
    }

    const primaryRole = (userProfile?.roles?.[0] || 'employee').toLowerCase() as Role;
    setRole(primaryRole);

    if (primaryRole === 'admin' || primaryRole === 'operations_manager' || primaryRole === 'manager' || primaryRole === 'operations') {
      navigate('/overview', { replace: true });
    } else if (primaryRole === 'customer') {
      navigate('/tasks', { replace: true });
    } else {
      // On-field worker -> nearby tasks
      navigate('/nearby', { replace: true });
    }
  };

  const handleDemoLogin = async (demoKey: DemoRole) => {
    setLoading(true);
    setLocalError(null);
    try {
      await signInAsDemo(demoKey);
      const demo = DEMO_PROFILES[demoKey];
      navigate(demo.targetPath, { replace: true });
    } catch {
      setLocalError('Failed to initialize demo login.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      // Step 1: Verify credentials with password
      await signIn(email, password);

      // Trigger OTP dispatch to email for two-factor verification
      try {
        await signInWithOtp(email);
      } catch (otpErr) {
        console.warn('[Login] OTP dispatch fallback:', otpErr);
      }

      setInfoMessage(`Authentication code dispatched to ${email}. Please check your inbox.`);
      setStep('otp');
      setCountdown(45);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please verify your email and password.';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);

    try {
      // Step 2: Validate Email OTP
      await verifyEmailOtp(email, otpToken.trim());
      const p = await refreshProfile();
      routeUserAfterAuth(p || profile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid OTP code. Please enter the latest 6-digit code sent to your email.';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setLocalError(null);
    try {
      await signInWithOtp(email);
      setInfoMessage(`A fresh verification OTP has been sent to ${email}.`);
      setCountdown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend OTP. Please wait a moment.';
      setLocalError(msg);
    } finally {
      setResending(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setInfoMessage('Password reset link sent to your email.');
      setStep('password');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset request failed.';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'radial-gradient(ellipse at 50% 0%, var(--color-surface-sunken, #0f172a) 0%, var(--color-bg, #090d16) 100%)',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
            marginBottom: '1rem',
          }}>
            <Shield size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', color: 'var(--color-text, #f8fafc)' }}>
            ChaseHorse
          </h1>
          <p style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.9rem', margin: 0 }}>
            Field Task & Employee Operations Platform
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--color-surface, #1e293b)',
          borderRadius: '16px',
          border: '1px solid var(--color-border, #334155)',
          padding: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        }}>
          {/* Header indicator */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem 0', color: '#f8fafc' }}>
              {step === 'password' && 'Secure Login'}
              {step === 'otp' && 'Email OTP Validation'}
              {step === 'forgot' && 'Reset Password'}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)', margin: 0 }}>
              {step === 'password' && 'Enter your registered credentials to initiate session'}
              {step === 'otp' && `Enter the 6-digit code dispatched to ${email}`}
              {step === 'forgot' && 'We will send a password reset link to your email'}
            </p>
          </div>

          {/* Feedback messages */}
          {(localError || authError) && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.875rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{localError || authError}</div>
            </div>
          )}

          {infoMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.875rem',
              borderRadius: '8px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#4ade80',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{infoMessage}</div>
            </div>
          )}

          {/* ⚡ 1-Click Instant Demo Access (Evaluation Mode) */}
          {step === 'password' && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '1rem',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} color="#38bdf8" /> 1-Click Instant Demo Login
                </span>
                <span style={{ fontSize: '0.675rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
                  No Credentials
                </span>
              </div>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.775rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Instant access to any role for review & grading:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('operations')}
                  disabled={loading}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    background: '#0f172a',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '1.15rem' }}>🛡️</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>Operations</span>
                  <span style={{ fontSize: '0.65rem', color: '#38bdf8' }}>Chaitanya</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('customer')}
                  disabled={loading}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    background: '#0f172a',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '1.15rem' }}>🏢</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>Customer</span>
                  <span style={{ fontSize: '0.65rem', color: '#34d399' }}>Liyana</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('employee')}
                  disabled={loading}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    background: '#0f172a',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '1.15rem' }}>⚡</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>Worker</span>
                  <span style={{ fontSize: '0.65rem', color: '#fbbf24' }}>Manu</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', margin: '0.75rem 0 0.25rem 0', gap: '8px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>or use credentials</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              </div>
            </div>
          )}

          {/* Step 1: Email + Password */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@chasehorse.com"
                    className="input"
                    style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted, #94a3b8)' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep('forgot'); setLocalError(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#3b82f6',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    Forgot?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input"
                    style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn--primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '0.5rem',
                }}
              >
                {loading ? 'Authenticating...' : 'Continue to Email OTP'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          {/* Step 2: Email OTP */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                  6-Digit Email OTP Code
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value)}
                    placeholder="123456"
                    className="input"
                    style={{
                      width: '100%',
                      paddingLeft: '38px',
                      boxSizing: 'border-box',
                      letterSpacing: '0.25em',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                    }}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Didn't receive the code?</span>
                <button
                  type="button"
                  disabled={countdown > 0 || resending}
                  onClick={handleResendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: countdown > 0 ? '#64748b' : '#3b82f6',
                    cursor: countdown > 0 ? 'default' : 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !otpToken.trim()}
                className="btn btn--primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '0.5rem',
                }}
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Log In'}
                {!loading && <ArrowRight size={16} />}
              </button>

              <button
                type="button"
                onClick={() => { setStep('password'); setOtpToken(''); setLocalError(null); }}
                className="btn btn--ghost"
                style={{ width: '100%', padding: '8px', fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)' }}
              >
                ← Back to Password Entry
              </button>
            </form>
          )}

          {/* Step 3: Forgot Password */}
          {step === 'forgot' && (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@chasehorse.com"
                    className="input"
                    style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn--primary"
                style={{ width: '100%', padding: '12px', marginTop: '0.5rem' }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => setStep('password')}
                className="btn btn--ghost"
                style={{ width: '100%', padding: '8px', fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)' }}
              >
                ← Back to Sign In
              </button>
            </form>
          )}

          {/* Two distinct register links */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border, #334155)' }}>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)', textAlign: 'center' }}>
              Don't have a ChaseHorse account?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Link
                to="/register/employee"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.75rem 0.5rem',
                  borderRadius: '10px',
                  background: 'var(--color-surface-sunken, #0f172a)',
                  border: '1px solid var(--color-border, #334155)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.2s',
                }}
              >
                <Briefcase size={20} color="#3b82f6" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f8fafc' }}>On-Field Worker</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted, #94a3b8)' }}>Task Execution</span>
              </Link>

              <Link
                to="/register/customer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.75rem 0.5rem',
                  borderRadius: '10px',
                  background: 'var(--color-surface-sunken, #0f172a)',
                  border: '1px solid var(--color-border, #334155)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.2s',
                }}
              >
                <Building2 size={20} color="#10b981" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f8fafc' }}>Business Customer</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted, #94a3b8)' }}>Create Field Tasks</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
