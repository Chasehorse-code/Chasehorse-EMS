import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Building2, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import type { Role } from '@/types';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

export function LoginPage() {
  const { signIn, signInAsDemo } = useAuth();
  const { setRole } = useRole();
  const navigate = useNavigate();

  const [activeWorkspace, setActiveWorkspace] = useState<'business' | 'operations' | 'worker'>('business');
  const [email, setEmail] = useState('name@company.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Switch workspace presets
  const handleSelectWorkspace = (ws: 'business' | 'operations' | 'worker') => {
    setActiveWorkspace(ws);
    setError(null);
    if (ws === 'business') {
      setEmail('customer@chasehorse.com');
      setPassword('customer123');
    } else if (ws === 'operations') {
      setEmail('manager@chasehorse.com');
      setPassword('manager123');
    } else {
      setEmail('worker@chasehorse.com');
      setPassword('worker123');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password === 'incorrect') {
      setError('Invalid password provided. Please check credentials.');
      return;
    }

    setLoading(true);
    try {
      const targetRole: Role =
        activeWorkspace === 'business'
          ? 'customer'
          : activeWorkspace === 'operations'
          ? 'operations_manager'
          : 'field_worker';

      setRole(targetRole);

      const demoKey =
        activeWorkspace === 'business'
          ? 'customer'
          : activeWorkspace === 'operations'
          ? 'operations'
          : 'employee';

      try {
        await signIn(email, password);
      } catch {
        await signInAsDemo(demoKey);
      }

      const redirectPath =
        activeWorkspace === 'business'
          ? '/customer/dashboard'
          : activeWorkspace === 'operations'
          ? '/overview'
          : '/nearby';

      navigate(redirectPath, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      subTag="ONE TASK, ONE RECORD"
      tagline="Every approval is backed by where, when and what was captured on site."
      previewCardDecision="Approved by operations"
      previewCardStatus="approved"
    >
      {/* Heading */}
      <h1
        style={{
          margin: '0 0 0.35rem 0',
          fontSize: '1.875rem',
          fontWeight: 700,
          color: '#111315',
          letterSpacing: '-0.02em',
        }}
      >
        Sign in
      </h1>
      <p
        style={{
          margin: '0 0 1.5rem 0',
          fontSize: '0.875rem',
          color: '#6b7280',
          lineHeight: 1.45,
        }}
      >
        Use your registered email. We'll send a one-time code to finish signing in.
      </p>

      {/* Demo Workspace Selector */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#6b7280',
            marginBottom: '0.5rem',
          }}
        >
          Demo workspace
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.04)',
            padding: '4px',
            borderRadius: '8px',
          }}
        >
          {(
            [
              { key: 'business', label: 'Business' },
              { key: 'operations', label: 'Operations' },
              { key: 'worker', label: 'Field worker' },
            ] as const
          ).map((item) => {
            const isSelected = activeWorkspace === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSelectWorkspace(item.key)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid transparent',
                  background: isSelected ? '#ffffff' : 'transparent',
                  color: isSelected ? '#111315' : '#6b7280',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 600 : 500,
                  boxShadow: isSelected ? '0 1px 3px rgba(0, 0, 0, 0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.75rem',
            borderRadius: '8px',
            background: '#fdecee',
            border: '1px solid #f87171',
            color: '#991b1b',
            fontSize: '0.8125rem',
            marginBottom: '1rem',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Sign In Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.375rem',
            }}
          >
            Email address
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#111315',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.375rem',
            }}
          >
            <label
              style={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: '#374151',
              }}
            >
              Password
            </label>
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault();
                alert('For demo evaluation, any password with 8+ characters works.');
              }}
              style={{
                fontSize: '0.75rem',
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Forgot password?
            </a>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 38px 10px 38px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#111315',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: '#9ca3af',
              }}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Keep Me Signed In Checkbox */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8125rem',
            color: '#374151',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              accentColor: '#111315',
              cursor: 'pointer',
            }}
          />
          <span>Keep me signed in on this device</span>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '11px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#111315',
            color: '#ffffff',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
            marginTop: '0.25rem',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#22252a')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#111315')}
        >
          <span>{loading ? 'Signing in...' : 'Continue'}</span>
          <ArrowRight size={16} />
        </button>
      </form>

      {/* Demo Hint Callout */}
      <div
        style={{
          marginTop: '1.25rem',
          padding: '0.875rem 1rem',
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          fontSize: '0.75rem',
          color: '#6b7280',
          lineHeight: 1.45,
        }}
      >
        Demo: any email with an 8+ character password works. Use the password <code>incorrect</code> to preview the error state.
      </div>

      {/* New to ChaseHorse Section */}
      <div style={{ marginTop: '1.75rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.25rem' }}>
        <p
          style={{
            margin: '0 0 0.75rem 0',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          New to ChaseHorse?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Link
            to="/register/customer"
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              textDecoration: 'none',
              transition: 'border-color 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#111315';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
              (e.currentTarget as HTMLElement).style.transform = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#111315', fontWeight: 600, fontSize: '0.8125rem' }}>
              <Building2 size={14} />
              <span>Business</span>
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: '2px' }}>
              Post field tasks
            </span>
          </Link>

          <Link
            to="/register/worker"
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              textDecoration: 'none',
              transition: 'border-color 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#111315';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
              (e.currentTarget as HTMLElement).style.transform = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#111315', fontWeight: 600, fontSize: '0.8125rem' }}>
              <User size={14} />
              <span>Field worker</span>
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: '2px' }}>
              Find tasks nearby
            </span>
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
