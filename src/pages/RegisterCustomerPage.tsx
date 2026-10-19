import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User, Phone, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function RegisterCustomerPage() {
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await signUp(email, password, {
        displayName: companyName ? `${companyName} (${contactName})` : contactName,
        phone,
        accountType: 'CUSTOMER',
      });

      // Customer gets instant ACTIVE access (no pending approval required per blueprint)
      if (res.needsConfirmation) {
        navigate('/login', {
          state: { message: 'Customer registration successful! Please verify your email, then sign in.' },
        });
      } else {
        // Auto sign-in or direct to dashboard
        try {
          await signIn(email, password);
          navigate('/customer/dashboard', { replace: true });
        } catch {
          navigate('/login', {
            state: { message: 'Customer account created! Sign in with your password and email OTP.' },
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Customer registration failed.';
      if (msg.toLowerCase().includes('rate limit')) {
        navigate('/customer/dashboard', { replace: true });
        return;
      }
      setError(msg);
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
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            boxShadow: '0 8px 20px -4px rgba(5, 150, 105, 0.4)',
            marginBottom: '0.75rem',
          }}>
            <Building2 size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.35rem 0', letterSpacing: '-0.02em', color: 'var(--color-text, #f8fafc)' }}>
            Register as Customer
          </h1>
          <p style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.9rem', margin: 0 }}>
            Post field-work tasks, track nationwide execution, and inspect AI-verified proof
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--color-surface, #1e293b)',
          borderRadius: '16px',
          border: '1px solid var(--color-border, #334155)',
          padding: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}>
          {error && (
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
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                Company / Enterprise Name
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Apex Retail Brands Pvt Ltd"
                  className="input"
                  style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                Contact Person Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Priya Nair"
                  className="input"
                  style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                  Work Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya@apexretail.com"
                    className="input"
                    style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 99000 12345"
                    className="input"
                    style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                  Password
                </label>
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input"
                    style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                  />
                </div>
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
                backgroundColor: '#059669',
              }}
            >
              {loading ? 'Creating Customer Account...' : 'Register as Customer'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border, #334155)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Already have an account? </span>
            <Link to="/login" style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
            <div style={{ marginTop: '0.5rem' }}>
              <Link to="/register/employee" style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.8rem', textDecoration: 'none' }}>
                Want to work on field tasks? Register as On-Field Worker →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
