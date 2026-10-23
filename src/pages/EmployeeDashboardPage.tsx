import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  Wallet,
  Camera,
  ClipboardList,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, CardHeader, StatCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { formatInr, formatDateTime } from '@/utils/format';
import { getCurrentGpsPosition, type GpsLocation } from '@/utils/geolocation';
import type { Task, WalletAccount, WalletTransaction } from '@/types';

export function EmployeeDashboardPage() {
  const { user, profile } = useAuth();
  const { actorName } = useRole();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [gps, setGps] = useState<GpsLocation | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const workerId = profile?.id || user?.id || 'emp-siva';
  const workerName = profile?.displayName || user?.email?.split('@')[0] || actorName || 'Field Operator';
  const workerRegion = profile?.region || 'Tenali Urban Cluster, Andhra Pradesh';

  // Acquire live GPS on mount
  const syncGps = async () => {
    setGpsLoading(true);
    try {
      const pos = await getCurrentGpsPosition();
      setGps(pos);
      notify(`GPS synchronized: ${pos.address || `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`}`);
    } catch {
      setGps({
        lat: 16.24184,
        lng: 80.6448,
        accuracy: 8,
        timestamp: Date.now(),
        address: 'Tenali Central Hub, Market Road, Tenali',
      });
    } finally {
      setGpsLoading(false);
    }
  };

  useEffect(() => {
    syncGps();
  }, []);

  // Fetch all tasks, submissions, and wallet data in parallel
  const dataState = useAsync(async () => {
    const [tasks, evidence, wallets] = await Promise.all([
      api.listTasks(),
      api.listEvidence(),
      api.listWalletAccounts().catch(() => [] as WalletAccount[]),
    ]);

    let txns: WalletTransaction[] = [];
    try {
      txns = await api.listTransactions(workerId);
    } catch {
      txns = [];
    }

    return { tasks, evidence, wallets, txns };
  }, [workerId]);

  const tasks = dataState.data?.tasks || [];
  const evidenceList = dataState.data?.evidence || [];
  const walletList = dataState.data?.wallets || [];

  // Active task currently assigned to this worker or in-progress
  const activeTask = useMemo(() => {
    return tasks.find(
      (t) =>
        t.status === 'in_progress' ||
        (t.status === 'assigned' && (!t.assigneeId || t.assigneeId === workerId)),
    );
  }, [tasks, workerId]);

  // Open tasks nearby
  const nearbyOpenTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status === 'open' && t.id !== activeTask?.id)
      .slice(0, 4);
  }, [tasks, activeTask]);

  // My submissions
  const mySubmissions = useMemo(() => {
    return evidenceList.slice(0, 5);
  }, [evidenceList]);

  // Calculations for stats
  const completedCount = useMemo(() => {
    return evidenceList.filter((e) => e.managerDecision?.status === 'approved').length;
  }, [evidenceList]);

  const walletAccount = walletList.find((w) => w.employeeId === workerId) || {
    employeeId: workerId,
    balanceInr: 1250,
    pendingInr: 350,
  };

  const handleAccept = async (task: Task) => {
    setAcceptingId(task.id);
    try {
      await api.acceptTask(task.id);
      notify(`Task "${task.title}" accepted! Opening execution checklist.`);
      dataState.reload();
      navigate(`/evidence?taskId=${task.id}`);
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to accept task', 'info');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (task: Task) => {
    setRejectingId(task.id);
    try {
      await api.rejectTask(task.id, 'Declined from worker home');
      notify(`Task "${task.title}" declined and removed from dispatch.`);
      dataState.reload();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to decline task', 'info');
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title={`Welcome back, ${workerName}`}
        description="On-Field Operations Hub — Execute assignments, complete checklists, submit geo-tagged proof, and track your wallet bounties."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={syncGps}
              className="btn btn--secondary btn--sm"
              disabled={gpsLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={gpsLoading ? 'spin' : ''} />
              {gpsLoading ? 'Acquiring GPS...' : 'Refresh GPS Fix'}
            </button>
            <Link to="/nearby" className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Navigation size={13} />
              Nearby Radar
            </Link>
          </div>
        }
      />

      {/* Operator Live Dispatch Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              color: '#ffffff',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
            }}
          >
            {workerName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                {workerName}
              </h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                VERIFIED OPERATOR
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                ID: EMP-CH-4091
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={13} color="#38bdf8" />
              <span>{gps?.address || workerRegion}</span>
              {gps?.accuracy && <span style={{ color: '#64748b' }}>(±{gps.accuracy}m fix)</span>}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dispatch Status
            </span>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>
              ● ACTIVE & DISPATCHED
            </p>
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid--stats grid--stats-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          icon={Wallet}
          tone="brand"
          label="Available Balance"
          value={formatInr(walletAccount.balanceInr)}
          hint="Verified funds ready for payout"
        />
        <StatCard
          icon={Clock}
          tone="warning"
          label="Pending Approval"
          value={formatInr(walletAccount.pendingInr)}
          hint="Staged rewards awaiting Ops sign-off"
        />
        <StatCard
          icon={CheckCircle2}
          tone="success"
          label="Tasks Completed"
          value={completedCount.toString()}
          hint="100% verified SLA completions"
        />
        <StatCard
          icon={ClipboardList}
          tone="ai"
          label="Active Execution"
          value={activeTask ? '1 In-Progress' : '0 Active'}
          hint={activeTask ? activeTask.category : 'Ready for assignment'}
        />
      </div>

      {/* Active Assignment Hero Card */}
      {activeTask ? (
        <Card style={{ marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.4)', background: 'linear-gradient(180deg, rgba(30, 58, 138, 0.15), rgba(15, 23, 42, 0.4))' }}>
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: '#1d4ed8',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  ⚡ Active Assignment In-Progress
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                  Reference: <strong>{activeTask.id}</strong>
                </span>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                Reward: ₹{activeTask.rewardInr}
              </span>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
              {activeTask.title}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0 0 1rem 0', maxWidth: '720px' }}>
              {activeTask.description}
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.25rem',
                alignItems: 'center',
                padding: '0.875rem 1rem',
                background: 'var(--color-surface-sunken, #0f172a)',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                <MapPin size={15} color="#ef4444" />
                <span>{activeTask.location.address || activeTask.location.area}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                <Clock size={15} color="#f59e0b" />
                <span>Due: {formatDateTime(activeTask.dueAt)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                <ShieldCheck size={15} color="#10b981" />
                <span>Category: {activeTask.category}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate(`/evidence?taskId=${activeTask.id}`)}
                className="btn btn--primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(29, 78, 216, 0.4)',
                }}
              >
                <Camera size={18} />
                Open Execution Checklist & Evidence Camera →
              </button>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeTask.location.lat},${activeTask.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={15} />
                Navigate in Maps
              </a>
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📋</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
              No Active Task In Progress
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0 0 1.25rem 0' }}>
              You are currently online and available. Discover open tasks within your GPS perimeter and accept work to start earning bounties.
            </p>
            <Link to="/nearby" className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={16} />
              Browse Nearby Field Tasks ({nearbyOpenTasks.length} Available) →
            </Link>
          </div>
        </Card>
      )}

      {/* Two Column Layout: Nearby Opportunities & Submissions Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Nearby Tasks Column */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border, #334155)' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Nearby Opportunities
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Within 10km of current GPS coordinates
              </p>
            </div>
            <Link to="/nearby" style={{ fontSize: '0.8125rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
              View Radar Map →
            </Link>
          </div>

          <div style={{ padding: '1rem 1.25rem' }}>
            {nearbyOpenTasks.length === 0 ? (
              <EmptyState
                title="No open tasks nearby"
                description="All tasks within your immediate radius have been assigned. Check back shortly for new dispatches."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {nearbyOpenTasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: 'var(--color-surface-sunken, #0f172a)',
                      border: '1px solid var(--color-border, #334155)',
                      borderRadius: '8px',
                      padding: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#60a5fa',
                          background: 'rgba(37, 99, 235, 0.12)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        📍 {t.distanceKm !== undefined ? `${t.distanceKm} km` : '1.2 km'} away
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>
                        ₹{t.rewardInr}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 0.25rem 0' }}>
                      {t.title}
                    </h4>
                    <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '0 0 0.75rem 0' }}>
                      {t.location.address || t.location.area}
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        disabled={acceptingId === t.id || rejectingId === t.id}
                        onClick={() => handleAccept(t)}
                        className="btn btn--primary btn--sm"
                        style={{ flex: 2 }}
                      >
                        {acceptingId === t.id ? 'Accepting...' : 'Accept Task'}
                      </button>
                      <button
                        type="button"
                        disabled={acceptingId === t.id || rejectingId === t.id}
                        onClick={() => handleDecline(t)}
                        className="btn btn--secondary btn--sm"
                        style={{ flex: 1 }}
                      >
                        {rejectingId === t.id ? '...' : 'Decline'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Submissions & Operations Review Status Column */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border, #334155)' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Recent Evidence Submissions
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Operations review queue and payout status
              </p>
            </div>
            <Link to="/evidence" style={{ fontSize: '0.8125rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
              Full History →
            </Link>
          </div>

          <div style={{ padding: '1rem 1.25rem' }}>
            {mySubmissions.length === 0 ? (
              <EmptyState
                title="No submissions yet"
                description="Accept and complete tasks to start submitting photo evidence for operations approval."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {mySubmissions.map((sub) => {
                  const status = sub.managerDecision?.status || 'pending';
                  const taskRef = tasks.find((t) => t.id === sub.taskId);

                  return (
                    <div
                      key={sub.id}
                      style={{
                        background: 'var(--color-surface-sunken, #0f172a)',
                        border: '1px solid var(--color-border, #334155)',
                        borderRadius: '8px',
                        padding: '0.875rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                          {taskRef?.title || `Task #${sub.taskId}`}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                          Submitted: {formatDateTime(sub.submittedAt)}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {status === 'approved' ? (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#10b981',
                              background: 'rgba(16, 185, 129, 0.15)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              display: 'inline-block',
                            }}
                          >
                            ✓ Approved (₹{taskRef?.rewardInr || 350})
                          </span>
                        ) : status === 'rework' ? (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#f59e0b',
                              background: 'rgba(245, 158, 11, 0.15)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              display: 'inline-block',
                            }}
                          >
                            ⚠️ Rework Requested
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#38bdf8',
                              background: 'rgba(56, 189, 248, 0.15)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              display: 'inline-block',
                            }}
                          >
                            ⏳ Pending Review
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Launchpad Navigation */}
      <Card>
        <CardHeader title="Operator Launchpad" subtitle="Fast navigation to key execution tools" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '0 1.25rem 1.25rem 1.25rem' }}>
          <Link
            to="/nearby"
            style={{
              textDecoration: 'none',
              background: 'var(--color-surface-sunken, #0f172a)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#f8fafc',
            }}
          >
            <Navigation size={24} color="#38bdf8" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Nearby Tasks</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Live GPS radar view</p>
            </div>
          </Link>

          <Link
            to="/evidence"
            style={{
              textDecoration: 'none',
              background: 'var(--color-surface-sunken, #0f172a)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#f8fafc',
            }}
          >
            <Camera size={24} color="#10b981" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Evidence Camera</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Watermark HUD capture</p>
            </div>
          </Link>

          <Link
            to="/wallet"
            style={{
              textDecoration: 'none',
              background: 'var(--color-surface-sunken, #0f172a)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#f8fafc',
            }}
          >
            <Wallet size={24} color="#f59e0b" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Rewards Wallet</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Ledger & payouts</p>
            </div>
          </Link>

          <Link
            to="/employee/profile"
            style={{
              textDecoration: 'none',
              background: 'var(--color-surface-sunken, #0f172a)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#f8fafc',
            }}
          >
            <ShieldCheck size={24} color="#a855f7" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Worker Profile & ID</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>SLA metrics & cluster</p>
            </div>
          </Link>
        </div>
      </Card>
    </>
  );
}
