import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Lock, Mail, KeyRound, AlertCircle, CheckCircle2, ArrowRight, Briefcase, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import type { Role } from '@/types';

export function LoginPage() {
  const { signIn, verifyEmailOtp, signInWithOtp, resetPassword, profile, refreshProfile, error: authError } = useAuth();
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
      background: 'var(--bg)',
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
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-signal, #f2551d)',
            boxShadow: 'var(--shadow-button)',
            marginBottom: '1rem',
          }}>
            <Shield size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            ChaseHorse
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Field Task & Employee Operations Platform
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border)',
          padding: '2rem',
          boxShadow: 'var(--shadow-panel)',
        }}>
          {/* Header indicator */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem 0', color: 'var(--ink)' }}>
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
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
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
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.2s',
                }}
              >
                <Briefcase size={20} color="var(--color-signal, #f2551d)" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)' }}>On-Field Worker</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Task Execution</span>
              </Link>

              <Link
                to="/register/customer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.75rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.2s',
                }}
              >
                <Building2 size={20} color="var(--color-verify, #0b7d54)" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)' }}>Business Customer</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Create Field Tasks</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
