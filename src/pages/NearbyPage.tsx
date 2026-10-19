import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card } from '@/components/ui/Card';
import { Async, EmptyState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { getCurrentGpsPosition, type GpsLocation } from '@/utils/geolocation';
import { priorityLabel, taskStatusLabel } from '@/utils/labels';
import type { Task } from '@/types';

const RADII = [5, 10, 25, 50];

export function NearbyPage() {
  const { notify } = useToast();
  const navigate = useNavigate();

  const [gps, setGps] = useState<GpsLocation | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(25);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'active'>('open');
  const [viewMode, setViewMode] = useState<'cards' | 'radar'>('cards');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Fetch initial GPS on mount
  const refreshLocation = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const pos = await getCurrentGpsPosition();
      setGps(pos);
      notify(`Acquired GPS location: ${pos.address || `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not access GPS.';
      setGpsError(msg);
      // Fallback coordinates for Bangalore hub if permission is blocked in browser
      setGps({
        lat: 12.9716,
        lng: 77.5946,
        accuracy: 25,
        timestamp: Date.now(),
        address: 'Bangalore Central, Karnataka (Simulated fallback)',
      });
    } finally {
      setGpsLoading(false);
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  // Query nearby tasks whenever GPS or radius changes
  const tasksState = useAsync(async () => {
    if (!gps) return [];
    return await api.listNearbyTasks(gps.lat, gps.lng, radius);
  }, [gps?.lat, gps?.lng, radius]);

  const tasks = tasksState.data || [];

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter === 'open') return t.status === 'open';
      if (statusFilter === 'active') return t.status === 'open' || t.status === 'in_progress' || t.status === 'assigned';
      return true;
    });
  }, [tasks, statusFilter]);

  const handleAcceptTask = async (task: Task) => {
    setAcceptingId(task.id);
    try {
      await api.acceptTask(task.id);
      notify(`Task "${task.title}" accepted! Proceeding to evidence checklist.`);
      tasksState.reload();
      navigate(`/evidence?taskId=${task.id}`);
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to accept task', 'info');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Nearby Field Tasks"
        description="Location-aware task allocation. Discover tasks within your live GPS range, accept work, and navigate to site."
      />

      {/* GPS Status Banner */}
      <div style={{
        background: 'var(--color-surface, #1e293b)',
        borderRadius: '14px',
        border: '1px solid var(--color-border, #334155)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: gpsError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.15)',
            color: gpsError ? '#f87171' : '#60a5fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <MapPin size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                {gps ? gps.address : 'Acquiring GPS location...'}
              </span>
              {gps && (
                <span style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#4ade80',
                  fontWeight: 600,
                }}>
                  Live GPS Fix (±{gps.accuracy}m)
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)' }}>
              Coordinates: {gps ? `${gps.lat.toFixed(5)}° N, ${gps.lng.toFixed(5)}° E` : 'Searching satellites...'}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={gpsLoading}
          onClick={refreshLocation}
          className="btn btn--secondary btn--sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={gpsLoading ? 'spin' : ''} />
          {gpsLoading ? 'Acquiring Location...' : 'Refresh GPS Location'}
        </button>
      </div>

      {/* Filter and Radius Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {/* Radius selector pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted, #94a3b8)', fontWeight: 500 }}>
            Search Radius:
          </span>
          <div className="segmented" role="group" aria-label="Search radius">
            {RADII.map((r) => (
              <button
                key={r}
                type="button"
                className={`segmented__btn ${radius === r ? 'segmented__btn--on' : ''}`}
                onClick={() => setRadius(r)}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* View mode & status filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            className="input input--compact"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="open">Open Tasks Only</option>
            <option value="active">Active & Open</option>
            <option value="all">All Nearby Tasks</option>
          </select>

          <div className="segmented" role="group" aria-label="View mode">
            <button
              type="button"
              className={`segmented__btn ${viewMode === 'cards' ? 'segmented__btn--on' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              List View
            </button>
            <button
              type="button"
              className={`segmented__btn ${viewMode === 'radar' ? 'segmented__btn--on' : ''}`}
              onClick={() => setViewMode('radar')}
            >
              Radar Map
            </button>
          </div>
        </div>
      </div>

      {/* Task List or Radar */}
      <Async state={tasksState} skeletonLines={6}>
        {() => (
          <>
            {filteredTasks.length === 0 ? (
              <Card>
                <EmptyState
                  title="No field tasks in this radius"
                  description={`No active tasks were found within ${radius} km of your current GPS coordinates. Try expanding the search radius or check back soon.`}
                />
              </Card>
            ) : viewMode === 'cards' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '1.25rem',
              }}>
                {filteredTasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: 'var(--color-surface, #1e293b)',
                      borderRadius: '14px',
                      border: '1px solid var(--color-border, #334155)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      position: 'relative',
                    }}
                  >
                    <div>
                      {/* Top Chips */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <Badge tone={taskStatusLabel[t.status].tone}>
                          {taskStatusLabel[t.status].label}
                        </Badge>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: '#60a5fa',
                          background: 'rgba(37, 99, 235, 0.12)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}>
                          <Navigation size={12} />
                          {t.distanceKm !== undefined ? `${t.distanceKm} km away` : 'Nearby'}
                        </span>
                      </div>

                      {/* Title & Category */}
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.35rem 0', color: '#f8fafc', lineHeight: 1.3 }}>
                        {t.title}
                      </h3>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)', margin: '0 0 0.75rem 0' }}>
                        Category: <strong style={{ color: '#cbd5e1' }}>{t.category}</strong> • Priority: <span style={{ color: priorityLabel[t.priority].tone === 'danger' ? '#f87171' : '#cbd5e1' }}>{priorityLabel[t.priority].label}</span>
                      </p>

                      {/* Location Address */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                        fontSize: '0.8125rem',
                        color: '#94a3b8',
                        background: 'var(--color-surface-sunken, #0f172a)',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                      }}>
                        <MapPin size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
                        <span>{t.location.address || t.location.area}</span>
                      </div>
                    </div>

                    {/* Bottom Reward & Actions */}
                    <div style={{ borderTop: '1px solid var(--color-border, #334155)', paddingTop: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)' }}>Task Reward:</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>
                          ₹{t.rewardInr}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {t.status === 'open' ? (
                          <button
                            type="button"
                            disabled={acceptingId === t.id}
                            onClick={() => handleAcceptTask(t)}
                            className="btn btn--primary"
                            style={{ flex: 1, padding: '9px 12px', fontSize: '0.875rem' }}
                          >
                            {acceptingId === t.id ? 'Accepting...' : 'Accept Task'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate(`/evidence?taskId=${t.id}`)}
                            className="btn btn--secondary"
                            style={{ flex: 1, padding: '9px 12px', fontSize: '0.875rem' }}
                          >
                            Work on Task
                          </button>
                        )}

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${t.location.lat},${t.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--ghost"
                          title="Open navigation in Google Maps"
                          style={{ padding: '9px 12px' }}
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Radar Map View */
              <Card>
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{
                    width: '320px',
                    height: '320px',
                    margin: '0 auto',
                    borderRadius: '50%',
                    border: '2px solid rgba(59, 130, 246, 0.3)',
                    background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {/* Concentric distance circles */}
                    <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', border: '1px dashed rgba(59, 130, 246, 0.2)' }} />
                    <div style={{ position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', border: '1px dashed rgba(59, 130, 246, 0.2)' }} />

                    {/* Center: Device GPS */}
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      boxShadow: '0 0 12px #3b82f6',
                      zIndex: 2,
                    }} title="Your GPS Location" />

                    {/* Task plotted markers */}
                    {gps && filteredTasks.map((t, idx) => {
                      const dLat = (t.location.lat - gps.lat) * 111;
                      const dLng = (t.location.lng - gps.lng) * 111 * Math.cos((gps.lat * Math.PI) / 180);
                      const maxR = radius;
                      const x = 160 + (dLng / maxR) * 140;
                      const y = 160 - (dLat / maxR) * 140;

                      return (
                        <div
                          key={t.id}
                          onClick={() => handleAcceptTask(t)}
                          style={{
                            position: 'absolute',
                            left: `${Math.max(10, Math.min(300, x))}px`,
                            top: `${Math.max(10, Math.min(300, y))}px`,
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            zIndex: 3,
                          }}
                          title={`${t.title} (₹${t.rewardInr})`}
                        >
                          {idx + 1}
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                    Center pin: You (live GPS) • Green markers: Active field tasks in range ({radius} km). Click marker to accept.
                  </p>
                </div>
              </Card>
            )}
          </>
        )}
      </Async>
    </>
  );
}
