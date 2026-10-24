import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, AlertCircle, ArrowRight, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getCurrentGpsPosition } from '@/utils/geolocation';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

export function RegisterEmployeePage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [password, setPassword] = useState('');
  const [showAboutFields, setShowAboutFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect location for Step 2
  useEffect(() => {
    getCurrentGpsPosition()
      .then((pos) => {
        const detected = pos.address
          ? pos.address.split(',').slice(0, 3).join(',').trim()
          : `${pos.lat.toFixed(4)}°N, ${pos.lng.toFixed(4)}°E`;
        setRegion(detected);
      })
      .catch(() => {
        setRegion('Indiranagar, Bengaluru');
      });
  }, []);

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError('Please enter your full legal name.');
      return;
    }
    if (!mobileNumber.trim()) {
      setError('Please enter your active mobile number.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, {
        displayName: fullName,
        phone: mobileNumber,
        region: region || 'Bengaluru East',
        accountType: 'EMPLOYEE',
        subRole: 'field_worker',
      });

      navigate('/pending-approval');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      if (msg.toLowerCase().includes('rate limit')) {
        navigate('/pending-approval');
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      subTag="FOR FIELD WORKERS"
      tagline="Pick up paid tasks near you. Your reward is credited when the work is approved."
      previewCardDecision="₹450 credited"
      previewCardStatus="approved"
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
          color: '#2563eb',
          textTransform: 'uppercase',
          marginBottom: '0.5rem',
        }}
      >
        <User size={13} />
        <span>Field Worker</span>
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
        Join as a field worker
      </h1>
      <p
        style={{
          margin: '0 0 1.5rem 0',
          fontSize: '0.875rem',
          color: '#6b7280',
          lineHeight: 1.45,
        }}
      >
        Takes about two minutes. New accounts are reviewed before you can accept tasks.
      </p>

      {/* 2-Step Progress Indicator */}
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
            borderBottom: step === 1 ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer',
          }}
        >
          1. About you
        </button>

        <button
          type="button"
          onClick={() => {
            if (fullName && mobileNumber && email) setStep(2);
          }}
          style={{
            padding: '8px 12px 10px 16px',
            border: 'none',
            background: 'none',
            fontSize: '0.8125rem',
            fontWeight: step === 2 ? 700 : 500,
            color: step === 2 ? '#111315' : '#6b7280',
            borderBottom: step === 2 ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer',
          }}
        >
          2. Work area
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

      {/* Step 1: About You */}
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
              Full name
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
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="As on your ID"
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
              Mobile number
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
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
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
              Email
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
                placeholder="you@example.com"
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

          {/* Continue Button */}
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
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#22252a')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#111315')}
          >
            <span>Continue</span>
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {/* Step 2: Work Area & Security */}
      {step === 2 && (
        <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              Primary work operational zone
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin
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
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Indiranagar, Bengaluru"
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
            <p style={{ margin: '4px 0 0 0', fontSize: '0.725rem', color: '#6b7280' }}>
              Nearby tasks within 15 km of this area will be shown in your feed.
            </p>
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
              Set account password
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
              <span>{loading ? 'Submitting registration...' : 'Submit Application'}</span>
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

      {/* About these fields accordion */}
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
            We use your name and mobile number to verify field submissions and credit your wallet. Your data is encrypted and only shared with operations managers reviewing your work.
          </div>
        )}
      </div>
    </AuthSplitLayout>
  );
}
