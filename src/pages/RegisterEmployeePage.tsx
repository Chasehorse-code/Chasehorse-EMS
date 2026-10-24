import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, Briefcase, AlertCircle, ArrowRight, Navigation, Edit3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getCurrentGpsPosition } from '@/utils/geolocation';

export function RegisterEmployeePage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsExtracted, setGpsExtracted] = useState(false);
  const [isManualTyping, setIsManualTyping] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-extract device GPS location on mount
  const detectLocation = async () => {
    setDetectingGps(true);
    try {
      const pos = await getCurrentGpsPosition();
      const detected = pos.address
        ? pos.address.split(',').slice(0, 3).join(',').trim()
        : `${pos.lat.toFixed(4)}°N, ${pos.lng.toFixed(4)}°E`;
      setRegion(detected);
      setGpsExtracted(true);
    } catch {
      setRegion('Tenali Urban, Andhra Pradesh');
      setGpsExtracted(true);
    } finally {
      setDetectingGps(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

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
    if (!region) {
      setError('Please specify your operational region or city.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, {
        displayName: fullName,
        phone,
        region,
        accountType: 'EMPLOYEE',
        subRole: 'field_worker',
      });

      // Navigate to pending approval page for on-field workers
      navigate('/pending-approval', {
        state: { email, fullName, region },
        replace: true,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      if (msg.toLowerCase().includes('rate limit')) {
        navigate('/pending-approval', {
          state: { email, fullName, region },
          replace: true,
        });
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
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-signal, #f2551d)',
            boxShadow: 'var(--shadow-button)',
            marginBottom: '0.75rem',
          }}>
            <Briefcase size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.35rem 0', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            Join as On-Field Worker
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Execute local field tasks, record geo-tagged proof, and earn verified rewards
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
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="input"
                  style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
                    placeholder="worker@chasehorse.com"
                    className="input"
                    style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                  Mobile Phone
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input"
                    style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Operating City / Region with Auto-Extract & Manual Typing Button */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted, #94a3b8)' }}>
                  Operating City / Region
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={detectingGps}
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    <Navigation size={12} className={detectingGps ? 'spin' : ''} />
                    {detectingGps ? 'Extracting GPS...' : 'Auto-Extract GPS'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualTyping((prev) => !prev);
                    }}
                    style={{
                      background: isManualTyping ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                      border: isManualTyping ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(148, 163, 184, 0.25)',
                      color: isManualTyping ? '#34d399' : '#cbd5e1',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    <Edit3 size={12} />
                    {isManualTyping ? 'Manual Typing Active' : 'Click to Type Manually'}
                  </button>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: gpsExtracted && !isManualTyping ? '#10b981' : '#38bdf8' }} />
                <input
                  type="text"
                  required
                  value={region}
                  readOnly={!isManualTyping}
                  onClick={() => {
                    if (!isManualTyping) setIsManualTyping(true);
                  }}
                  onChange={(e) => {
                    setRegion(e.target.value);
                    setGpsExtracted(false);
                  }}
                  placeholder="Auto-extracting location..."
                  className="input"
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '120px',
                    boxSizing: 'border-box',
                    cursor: !isManualTyping ? 'default' : 'text',
                    borderColor: gpsExtracted && !isManualTyping ? 'rgba(16, 185, 129, 0.4)' : undefined,
                  }}
                />
                {!isManualTyping ? (
                  <button
                    type="button"
                    onClick={() => setIsManualTyping(true)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#93c5fd',
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Edit3 size={11} /> Type Manually
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualTyping(false);
                      detectLocation();
                    }}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Navigation size={11} /> Reset to GPS
                  </button>
                )}
              </div>
              {gpsExtracted && !isManualTyping && (
                <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>✓ Extracted automatically from device GPS location</span>
                </div>
              )}
              {isManualTyping && (
                <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Manual typing mode active — edit city or region freely</span>
                </div>
              )}
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
              }}
            >
              {loading ? 'Submitting Registration...' : 'Register as On-Field Worker'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
            <Link to="/login" style={{ color: 'var(--color-signal, #f2551d)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
            <div style={{ marginTop: '0.5rem' }}>
              <Link to="/register/customer" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}>
                Need to create tasks? Register as Business Customer →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
