import { useState } from 'react';
import { Search, Compass, Truck, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/Card';

export function CustomerTrackingPage() {
  const [query, setQuery] = useState('CH20240512001');
  const [activeTrackingId, setActiveTrackingId] = useState('CH20240512001');

  const milestones = [
    { title: 'Consignment Manifested', location: 'Vijayawada Central Logistics Hub', time: '19 Oct 2026, 06:30 AM', completed: true },
    { title: 'Dispatched & In-Transit', location: 'NH-16 Highway Corridor', time: '19 Oct 2026, 09:15 AM', completed: true },
    { title: 'Arrived at Local Cluster Hub', location: 'Tenali Transit Center', time: '19 Oct 2026, 11:45 AM', completed: true },
    { title: 'Out for Field Handover', location: 'Station Road Route #4', time: '19 Oct 2026, 01:20 PM', completed: false, current: true },
    { title: 'Delivered & Evidence Geo-Tagged', location: 'Apex Retail Partner Store #12', time: 'Expected by 03:30 PM', completed: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Consignment & Shipment Tracking"
        description="Monitor authorized transport dispatches, carrier telemetry, and live delivery milestones across India."
      />

      {/* Search Bar */}
      <Card>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Tracking Consignment ID (e.g. CH20240512001)..."
              className="input"
              style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="button"
            onClick={() => setActiveTrackingId(query.trim() || 'CH20240512001')}
            className="btn btn--primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Compass size={16} /> Track Shipment
          </button>
        </div>
      </Card>

      {/* Shipment Status Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Milestone Timeline Card */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase' }}>Consignment</span>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)' }}>
                {activeTrackingId}
              </h3>
            </div>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              Out for Delivery
            </span>
          </div>

          <div style={{ position: 'relative', paddingLeft: '24px' }}>
            {/* Timeline vertical bar */}
            <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'var(--color-border, #334155)' }} />

            {milestones.map((m, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: i === milestones.length - 1 ? 0 : '1.5rem' }}>
                <div style={{
                  position: 'absolute',
                  left: '-24px',
                  top: '2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: m.completed ? '#10b981' : m.current ? '#38bdf8' : '#334155',
                  boxShadow: m.current ? '0 0 0 4px rgba(56, 189, 248, 0.25)' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {m.completed && <CheckCircle2 size={12} color="#ffffff" />}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: m.completed || m.current ? 'var(--color-text, #f8fafc)' : '#64748b' }}>
                    {m.title}
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.775rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                    {m.location}
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.725rem', color: '#64748b' }}>
                    {m.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Carrier & Vehicle Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text, #f8fafc)' }}>
              Assigned Fleet Carrier
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}>
                <Truck size={24} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text, #f8fafc)' }}>
                  ChaseHorse Express Fleet #AP-07-TY-4091
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                  Driver: Suresh Babu (Verified Logistics Partner)
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', borderTop: '1px solid var(--color-border, #334155)', paddingTop: '0.75rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>GPS Speed:</span> <strong style={{ color: '#e2e8f0' }}>42 km/h</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Estimated Arrival:</span> <strong style={{ color: '#10b981' }}>14:15 IST</strong>
              </div>
            </div>
          </Card>

          <Card>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text, #f8fafc)' }}>
              Proof of Delivery Security
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted, #94a3b8)', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
              Upon arrival, driver and recipient must record digital OTP verification along with a geotagged photo proof stamped with IST clock and GPS coordinates.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#10b981' }}>
              <ShieldCheck size={14} /> End-to-end encrypted dispatch record
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
