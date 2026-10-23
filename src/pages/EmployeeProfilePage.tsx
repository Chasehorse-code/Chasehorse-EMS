import { useNavigate } from 'react-router-dom';
import { Phone, Building2, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';

export function EmployeeProfilePage() {
  const { user, profile, signOut } = useAuth();
  const { actorName } = useRole();
  const { notify } = useToast();
  const navigate = useNavigate();

  const workerName = profile?.displayName || user?.email?.split('@')[0] || actorName || 'Field Operator';
  const workerEmail = profile?.email || user?.email || 'worker@chasehorse.com';
  const workerPhone = profile?.phone || '+91 98480 33445';
  const workerRegion = profile?.region || 'Tenali Urban Cluster, Andhra Pradesh';
  const accountStatus = profile?.accountStatus || 'ACTIVE';

  const handleLogout = async () => {
    try {
      await signOut();
      notify('Signed out successfully.');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Sign out failed', 'info');
    }
  };

  return (
    <>
      <PageHeader
        title="Worker Profile & Field Credentials"
        description="Verified on-field operator credentials, assigned regional dispatch cluster, and performance SLA records."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Worker ID Card */}
        <Card>
          <CardHeader title="Operator ID & Dispatch Card" subtitle="Enterprise field operations authorization" />
          <div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  color: '#ffffff',
                  boxShadow: '0 0 18px rgba(59, 130, 246, 0.4)',
                }}
              >
                {workerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                  {workerName}
                </h3>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.875rem', color: '#94a3b8' }}>
                  On-Field Operations Associate
                </p>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ✓ VERIFIED FIELD OPERATOR
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                background: 'var(--color-surface-sunken, #0f172a)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #334155)',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Employee ID:</span>
                <strong style={{ color: '#f8fafc' }}>EMP-CH-4091</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Email:</span>
                <span style={{ color: '#cbd5e1' }}>{workerEmail}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Phone:</span>
                <span style={{ color: '#cbd5e1' }}>{workerPhone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Operational Cluster:</span>
                <span style={{ color: '#38bdf8' }}>{workerRegion}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Account Status:</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>● {accountStatus}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance & SLA Record */}
        <Card>
          <CardHeader title="SLA & Performance Record" subtitle="Verified field task execution quality metrics" />
          <div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  background: 'var(--color-surface-sunken, #0f172a)',
                  border: '1px solid var(--color-border, #334155)',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', display: 'block' }}>
                  98.6%
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>On-Time Arrival SLA</span>
              </div>

              <div
                style={{
                  background: 'var(--color-surface-sunken, #0f172a)',
                  border: '1px solid var(--color-border, #334155)',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', display: 'block' }}>
                  34
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Tasks Verified</span>
              </div>

              <div
                style={{
                  background: 'var(--color-surface-sunken, #0f172a)',
                  border: '1px solid var(--color-border, #334155)',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', display: 'block' }}>
                  4.9 ★
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Manager Quality Score</span>
              </div>

              <div
                style={{
                  background: 'var(--color-surface-sunken, #0f172a)',
                  border: '1px solid var(--color-border, #334155)',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#a855f7', display: 'block' }}>
                  100%
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>GPS Geofence Match</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                padding: '0.875rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                color: '#93c5fd',
              }}
            >
              ★ Top 5% Field Worker ranking in Tenali Cluster for October 2026.
            </div>
          </div>
        </Card>
      </div>

      {/* Field Support & Hotline */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardHeader title="Field Dispatch Hotline & Assistance" subtitle="24/7 dedicated operational support for field operators" />
        <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div
            style={{
              background: 'var(--color-surface-sunken, #0f172a)',
              border: '1px solid var(--color-border, #334155)',
              padding: '1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Phone size={24} color="#10b981" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                Toll-Free Dispatch Control
              </p>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#38bdf8' }}>1800-419-8800 (Option 2)</p>
            </div>
          </div>

          <div
            style={{
              background: 'var(--color-surface-sunken, #0f172a)',
              border: '1px solid var(--color-border, #334155)',
              padding: '1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Building2 size={24} color="#3b82f6" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                Regional Hub Office
              </p>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94a3b8' }}>
                Tenali Transit Center Hub #2
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button
          type="button"
          onClick={handleLogout}
          className="btn btn--danger"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
        >
          <LogOut size={16} />
          Sign Out of Worker Account
        </button>
      </div>
    </>
  );
}
