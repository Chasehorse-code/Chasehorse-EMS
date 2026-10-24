import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User, Phone, AlertCircle, ArrowRight, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

export function RegisterCustomerPage() {
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showAboutFields, setShowAboutFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!companyName.trim()) {
      setError('Please enter your business or company name.');
      return;
    }
    if (!contactName.trim()) {
      setError('Please enter your contact name.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

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

      if (res.needsConfirmation) {
        navigate('/login', {
          state: { message: 'Customer registration successful! Please verify your email, then sign in.' },
        });
      } else {
        try {
          await signIn(email, password);
          navigate('/customer/dashboard', { replace: true });
        } catch {
          navigate('/login', {
            state: { message: 'Customer account created! Sign in with your password.' },
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
    <AuthSplitLayout
      subTag="FOR ENTERPRISES"
      tagline="Deploy tasks to thousands of nearby field workers and get verified photo proof in hours."
      previewCardDecision="Verified by operations"
      previewCardStatus="review"
    >
      {/* Category Tag */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#059669',
          textTransform: 'uppercase',
          marginBottom: '0.5rem',
        }}
      >
        <Building2 size={13} />
        <span>Enterprise Customer</span>
      </div>

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
        Join as a business
      </h1>
      <p
        style={{
          margin: '0 0 1.5rem 0',
          fontSize: '0.875rem',
          color: '#6b7280',
          lineHeight: 1.45,
        }}
      >
        Post field tasks nationwide, inspect GPS-verified camera evidence, and approve instant worker payouts.
      </p>

      {/* Stepper */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => setStep(1)}
          style={{
            padding: '8px 12px 10px 0',
            border: 'none',
            background: 'none',
            fontSize: '0.8125rem',
            fontWeight: step === 1 ? 700 : 500,
            color: step === 1 ? '#111315' : '#6b7280',
            borderBottom: step === 1 ? '2px solid #059669' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer',
          }}
        >
          1. Company info
        </button>

        <button
          type="button"
          onClick={() => {
            if (companyName && contactName) setStep(2);
          }}
          style={{
            padding: '8px 12px 10px 16px',
            border: 'none',
            background: 'none',
            fontSize: '0.8125rem',
            fontWeight: step === 2 ? 700 : 500,
            color: step === 2 ? '#111315' : '#6b7280',
            borderBottom: step === 2 ? '2px solid #059669' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer',
          }}
        >
          2. Account credentials
        </button>
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

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              Company / Brand name
            </label>
            <div style={{ position: 'relative' }}>
              <Building2
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
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Retail Brands India"
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
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.375rem',
              }}
            >
              Primary contact person
            </label>
            <div style={{ position: 'relative' }}>
              <User
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
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Sunita Rao"
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

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#111315',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              marginTop: '0.25rem',
            }}
          >
            <span>Continue</span>
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
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
              Work email address
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
                placeholder="sunita@company.com"
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
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.375rem',
              }}
            >
              Business phone number
            </label>
            <div style={{ position: 'relative' }}>
              <Phone
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
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12345"
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
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.375rem',
              }}
            >
              Set password
            </label>
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
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

          <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                padding: '11px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
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
              }}
            >
              <span>{loading ? 'Creating account...' : 'Create Business Account'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      )}

      {/* Already have an account link */}
      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
          Already have an account?{' '}
        </span>
        <Link
          to="/login"
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#2563eb',
            textDecoration: 'none',
          }}
        >
          Sign in
        </Link>
      </div>

      {/* About fields accordion */}
      <div style={{ marginTop: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setShowAboutFields(!showAboutFields)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '0.75rem',
            color: '#6b7280',
            cursor: 'pointer',
          }}
        >
          <Info size={14} />
          <span>About these fields</span>
        </button>

        {showAboutFields && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              borderRadius: '6px',
              background: 'rgba(0, 0, 0, 0.03)',
              fontSize: '0.725rem',
              color: '#4b5563',
              lineHeight: 1.45,
            }}
          >
            We use your business email to provision your dedicated client portal. Tasks posted are visible only to verified field workers within your designated radius.
          </div>
        )}
      </div>
    </AuthSplitLayout>
  );
}
