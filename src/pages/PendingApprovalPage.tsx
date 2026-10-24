import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert, CheckCircle2, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function PendingApprovalPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const locState = (location.state as { email?: string; fullName?: string; region?: string }) || {};
  const email = profile?.email || user?.email || locState.email || 'Your account';
  const displayName = profile?.displayName || locState.fullName || 'On-Field Worker';
  const region = profile?.region || locState.region || 'Pending assignment';

  // If already approved, redirect to dashboard or nearby tasks
  useEffect(() => {
    if (profile?.accountStatus === 'ACTIVE') {
      navigate('/nearby', { replace: true });
    }
  }, [profile, navigate]);

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      const updated = await refreshProfile();
      if (updated?.accountStatus === 'ACTIVE') {
        setStatusMessage('Your account has been approved! Redirecting to field tasks...');
        setTimeout(() => navigate('/nearby', { replace: true }), 1500);
      } else if (updated?.accountStatus === 'REJECTED') {
        setStatusMessage('Your application was not approved by operations. Please contact support.');
      } else {
        setStatusMessage('Your account is still pending review by an Operations Manager.');
      }
    } catch {
      setStatusMessage('Unable to connect to verification server. Please retry in a moment.');
    } finally {
      setChecking(false);
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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-review, #94600a)',
            boxShadow: 'var(--shadow-button)',
            marginBottom: '1rem',
          }}>
            <Clock size={34} color="#ffffff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--ink)' }}>
            Account Pending Approval
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', margin: 0, lineHeight: 1.5 }}>
            Your on-field worker registration is under review by Operations Management.
          </p>
        </div>

        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border)',
          padding: '2rem',
          boxShadow: 'var(--shadow-panel)',
        }}>
          {statusMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem',
              borderRadius: 'var(--radius-sm)',
              background: statusMessage.includes('approved') ? 'var(--good-soft)' : 'var(--warn-soft)',
              border: statusMessage.includes('approved') ? '1px solid var(--good)' : '1px solid var(--warn)',
              color: statusMessage.includes('approved') ? 'var(--good)' : 'var(--warn)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}>
              {statusMessage.includes('approved') ? <CheckCircle2 size={18} /> : <RefreshCw size={18} />}
              <div>{statusMessage}</div>
            </div>
          )}

          <div style={{
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-review, #94600a)', fontSize: '0.875rem', fontWeight: 600 }}>
              <ShieldAlert size={16} />
              <span>Review Checklist for On-Field Worker Access</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li>Verification of worker identity and contact credentials</li>
              <li>Operational region and nearby task routing assignment</li>
              <li>Operations Manager role confirmation (On-field worker)</li>
            </ul>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            padding: '0.75rem 0',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Applicant:</span>
              <strong style={{ color: 'var(--ink)' }}>{displayName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Email:</span>
              <span style={{ color: 'var(--text-muted)' }}>{email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Region:</span>
              <span style={{ color: 'var(--text-muted)' }}>{region}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span style={{
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                PENDING APPROVAL
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              disabled={checking}
              onClick={handleCheckStatus}
              className="btn btn--primary"
              style={{
                width: '100%',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <RefreshCw size={16} className={checking ? 'spin' : ''} />
              {checking ? 'Checking Status...' : 'Check Approval Status'}
            </button>

            <button
              type="button"
              onClick={() => {
                signOut();
                navigate('/login', { replace: true });
              }}
              className="btn btn--ghost"
              style={{
                width: '100%',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--color-text-muted, #94a3b8)',
              }}
            >
              <LogOut size={16} /> Sign Out & Return to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
