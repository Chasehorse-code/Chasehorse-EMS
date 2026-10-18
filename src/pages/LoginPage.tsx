import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, Mail, User, AlertCircle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { ROLES, roleMeta } from '@/config/access';
import type { Role } from '@/types';

export function LoginPage() {
  const { signIn, signUp, resetPassword, error: authError } = useAuth();
  const { setRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('operations');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        navigate(from, { replace: true });
      } else if (mode === 'signup') {
        const res = await signUp(email, password, displayName);
        if (res.needsConfirmation) {
          setInfoMessage('Account created! Please check your email to confirm registration before logging in.');
          setMode('signin');
        } else {
          setInfoMessage('Account created and signed in successfully!');
          navigate(from, { replace: true });
        }
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setInfoMessage('Password reset link sent to your email.');
        setMode('signin');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication operation failed.';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = (role: Role) => {
    setRole(role);
    navigate('/', { replace: true });
  };

  return (
    <div className="login-container" style={{
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
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
            marginBottom: '1rem'
          }}>
            <Shield size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            ChaseHorse ERP
          </h1>
          <p style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.9rem', margin: 0 }}>
            Unified Field Operations & Transport Management
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--color-surface, #1e293b)',
          borderRadius: '16px',
          border: '1px solid var(--color-border, #334155)',
          padding: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            background: 'var(--color-surface-sunken, #0f172a)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '1.5rem'
          }}>
            <button
              type="button"
              onClick={() => { setMode('signin'); setLocalError(null); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'signin' ? 'var(--color-surface, #1e293b)' : 'transparent',
                color: mode === 'signin' ? '#ffffff' : 'var(--color-text-muted, #94a3b8)',
                fontWeight: mode === 'signin' ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setLocalError(null); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'signup' ? 'var(--color-surface, #1e293b)' : 'transparent',
                color: mode === 'signup' ? '#ffffff' : 'var(--color-text-muted, #94a3b8)',
                fontWeight: mode === 'signup' ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Register
            </button>
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
              marginBottom: '1.25rem'
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
              marginBottom: '1.25rem'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{infoMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Sanjay Rao"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '8px',
                      background: 'var(--color-surface-sunken, #0f172a)',
                      border: '1px solid var(--color-border, #334155)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

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
                  placeholder="operator@chasehorse.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    background: 'var(--color-surface-sunken, #0f172a)',
                    border: '1px solid var(--color-border, #334155)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted, #94a3b8)' }}>
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setLocalError(null); }}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '8px',
                      background: 'var(--color-surface-sunken, #0f172a)',
                      border: '1px solid var(--color-border, #334155)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                  Intended Operational Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--color-surface-sunken, #0f172a)',
                    border: '1px solid var(--color-border, #334155)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleMeta[r].label} — {roleMeta[r].blurb}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                padding: '11px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.925rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              {loading ? (
                'Processing...'
              ) : mode === 'signin' ? (
                <>Sign In to Workspace <ArrowRight size={16} /></>
              ) : mode === 'signup' ? (
                'Create Enterprise Account'
              ) : (
                'Send Reset Instructions'
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('signin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted, #94a3b8)',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Back to Sign In
              </button>
            )}
          </form>

          {/* Quick Demo Personas Access */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border, #334155)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#93c5fd', fontSize: '0.8rem', fontWeight: 600 }}>
              <Sparkles size={14} />
              <span>QUICK DEMO ACCESS (BYPASS FOR EVALUATION)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {(['admin', 'operations', 'manager', 'partner'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleDemoAccess(r)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border, #334155)',
                    background: 'var(--color-surface-sunken, #0f172a)',
                    color: 'var(--color-text, #e2e8f0)',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{roleMeta[r].label}</span>
                  <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Demo</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
