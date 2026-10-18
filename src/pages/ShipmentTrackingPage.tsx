import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  MapPin,
  Search,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/api';
import { PageHeader, Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/format';
import type { TmsShipmentStatus, TmsTrackingDetails } from '@/types';

const MILESTONES: { status: TmsShipmentStatus; label: string; desc: string }[] = [
  { status: 'CONFIRMED', label: 'Booking Confirmed', desc: 'Consignment booked in system' },
  { status: 'ASSIGNED', label: 'Driver Assigned', desc: 'Vehicle & operator allocated' },
  { status: 'IN_TRANSIT', label: 'In Transit', desc: 'Consignment moving along corridor' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Vehicle approaching delivery dock' },
  { status: 'DELIVERED', label: 'Delivered', desc: 'Signed proof of delivery verified' },
];

function getMilestoneIndex(status: TmsShipmentStatus): number {
  switch (status) {
    case 'CONFIRMED':
      return 0;
    case 'ASSIGNED':
    case 'DISPATCHED':
      return 1;
    case 'IN_TRANSIT':
      return 2;
    case 'OUT_FOR_DELIVERY':
      return 3;
    case 'DELIVERED':
      return 4;
    default:
      return 0;
  }
}

export function ShipmentTrackingPage() {
  const { reference } = useParams<{ reference: string }>();
  const [searchInput, setSearchInput] = useState(reference || '');
  const [trackingData, setTrackingData] = useState<TmsTrackingDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchTracking(ref: string) {
    if (!ref.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTracking(ref.trim());
      setTrackingData(data);
    } catch (err: any) {
      setTrackingData(null);
      setError(err.message || 'No shipment found matching reference: ' + ref);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (reference) {
      setSearchInput(reference);
      fetchTracking(reference);
    }
  }, [reference]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchTracking(searchInput.trim());
    }
  }

  const currentStep = trackingData ? getMilestoneIndex(trackingData.status) : 0;

  return (
    <>
      <PageHeader
        title="Live Shipment Milestone Tracking"
        description="Verify real-time transit checkpoints, route progression, and digital proof of delivery."
        actions={
          <Link to="/bookings" className="btn btn--ghost btn--md">
            <ArrowLeft size={16} style={{ marginRight: '4px' }} /> View All Bookings
          </Link>
        }
      />

      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        {/* Search Bar */}
        <Card style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Enter Booking Reference (e.g. CH-TMS-10293)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  fontSize: '0.9375rem',
                  outline: 'none',
                }}
              />
            </div>
            <Button type="submit" tone="primary" disabled={loading}>
              <Search size={16} style={{ marginRight: '6px' }} /> {loading ? 'Tracking...' : 'Track Consignment'}
            </Button>
          </form>
        </Card>

        {error && (
          <Card style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            <AlertCircle size={36} color="var(--error)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
              Shipment Not Found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
              {error}
            </p>
            <Button tone="ghost" onClick={() => fetchTracking(searchInput)}>
              Retry Search
            </Button>
          </Card>
        )}

        {trackingData && (
          <Card>
            <div style={{ padding: '1.75rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Booking Reference
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: '0.25rem 0 0 0' }}>
                  {trackingData.bookingRef}
                </h2>
              </div>
              <Badge tone={trackingData.status === 'DELIVERED' ? 'success' : 'info'}>
                {trackingData.status}
              </Badge>
            </div>

            {/* Visual Milestones Timeline */}
            <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {MILESTONES.map((m, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;
                  return (
                    <div key={m.status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', zIndex: 2 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isDone ? 'var(--primary-blue)' : 'var(--surface)',
                          border: `2px solid ${isDone ? 'var(--primary-blue)' : 'var(--border)'}`,
                          color: isDone ? '#ffffff' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          marginBottom: '0.75rem',
                          boxShadow: isCurrent ? '0 0 0 4px rgba(23, 105, 245, 0.2)' : 'none',
                        }}
                      >
                        {isDone ? <CheckCircle2 size={18} /> : idx + 1}
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: isDone ? 700 : 500, color: isDone ? 'var(--text)' : 'var(--text-muted)' }}>
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipment Overview Details */}
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span className="muted" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Pickup Location</span>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: 'var(--text)', fontSize: '0.9375rem' }}>
                  {trackingData.originAddress}
                </p>
              </div>
              <div>
                <span className="muted" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Delivery Location</span>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: 'var(--text)', fontSize: '0.9375rem' }}>
                  {trackingData.destinationAddress}
                </p>
              </div>
              {trackingData.cargoDescription && (
                <div>
                  <span className="muted" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Cargo Item & Weight</span>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: 'var(--text)', fontSize: '0.9375rem' }}>
                    {trackingData.cargoDescription} ({trackingData.cargoWeightKg} kg)
                  </p>
                </div>
              )}
              <div>
                <span className="muted" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Booked Timestamp</span>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: 'var(--text)', fontSize: '0.9375rem' }}>
                  {formatDate(trackingData.createdAt)}
                </p>
              </div>
            </div>

            {/* Event Milestone Log */}
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.25rem' }}>
                Checkpoint Activity Log
              </h3>

              {trackingData.events && trackingData.events.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {trackingData.events.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--info-bg)',
                          color: 'var(--primary-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Compass size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <strong style={{ fontSize: '0.9375rem', color: 'var(--text)' }}>{ev.eventType}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(ev.recordedAt)}</span>
                        </div>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                          {ev.locationText}
                        </p>
                        {ev.notes && (
                          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-faint)' }}>
                            {ev.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: '0.875rem' }}>
                  Consignment registered in dispatch system. Awaiting first transit checkpoint event.
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
