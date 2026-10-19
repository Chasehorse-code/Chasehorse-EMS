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
      background: 'radial-gradient(ellipse at 50% 0%, var(--color-surface-sunken, #0f172a) 0%, var(--color-bg, #090d16) 100%)',
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)',
            marginBottom: '1rem',
          }}>
            <Clock size={34} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--color-text, #f8fafc)' }}>
            Account Pending Approval
          </h1>
          <p style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.925rem', margin: 0, lineHeight: 1.5 }}>
            Your on-field worker registration is under review by Operations Management.
          </p>
        </div>

        <div style={{
          background: 'var(--color-surface, #1e293b)',
          borderRadius: '16px',
          border: '1px solid var(--color-border, #334155)',
          padding: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}>
          {statusMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem',
              borderRadius: '8px',
              background: statusMessage.includes('approved') ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              border: statusMessage.includes('approved') ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
              color: statusMessage.includes('approved') ? '#4ade80' : '#93c5fd',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}>
              {statusMessage.includes('approved') ? <CheckCircle2 size={18} /> : <RefreshCw size={18} />}
              <div>{statusMessage}</div>
            </div>
          )}

          <div style={{
            background: 'var(--color-surface-sunken, #0f172a)',
            borderRadius: '10px',
            border: '1px solid var(--color-border, #334155)',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#f59e0b', fontSize: '0.875rem', fontWeight: 600 }}>
              <ShieldAlert size={16} />
              <span>Review Checklist for On-Field Worker Access</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)', lineHeight: 1.6 }}>
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
            borderTop: '1px solid var(--color-border, #334155)',
            borderBottom: '1px solid var(--color-border, #334155)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Applicant:</span>
              <strong style={{ color: '#f8fafc' }}>{displayName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Email:</span>
              <span style={{ color: '#cbd5e1' }}>{email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Region:</span>
              <span style={{ color: '#cbd5e1' }}>{region}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Status:</span>
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
