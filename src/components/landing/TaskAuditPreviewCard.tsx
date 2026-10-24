import { Check, CheckCircle2 } from 'lucide-react';

export interface TaskAuditPreviewCardProps {
  status?: 'approved' | 'review';
  decisionLabel?: string;
  showThumbnails?: boolean;
  showActions?: boolean;
  className?: string;
}

export function TaskAuditPreviewCard({
  status = 'approved',
  decisionLabel = '₹450 credited',
  showThumbnails = false,
  showActions = false,
  className = '',
}: TaskAuditPreviewCardProps) {
  const isApproved = status === 'approved';

  return (
    <div
      className={`task-audit-card ${className}`}
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '1.25rem',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        color: '#111315',
        fontFamily: 'var(--font-sans)',
        maxWidth: '420px',
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'left',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.625rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: '#64748b',
            letterSpacing: '0.02em',
          }}
        >
          CH-24817 · Indiranagar
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '4px',
            background: isApproved ? '#e6f7ef' : '#fef3c7',
            color: isApproved ? '#0c7c59' : '#b45309',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '1px',
              background: isApproved ? '#0c7c59' : '#b45309',
            }}
          />
          {isApproved ? 'Approved' : 'In review'}
        </span>
      </div>

      {/* Task Title */}
      <h3
        style={{
          margin: '0 0 0.25rem 0',
          fontSize: '1.05rem',
          fontWeight: 700,
          color: '#111315',
          letterSpacing: '-0.01em',
        }}
      >
        Shelf audit — beverages aisle
      </h3>

      {showThumbnails && (
        <p
          style={{
            margin: '0 0 0.75rem 0',
            fontSize: '0.775rem',
            color: '#64748b',
          }}
        >
          Apex Retail Brands · ₹450 · Ravi K.
        </p>
      )}

      {/* Retail Shelf Audit Photo Graphic */}
      <div
        style={{
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#0c121e',
          marginTop: '0.5rem',
          marginBottom: '0.875rem',
          aspectRatio: '16 / 10',
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Shelf Illustration SVG */}
        <svg
          viewBox="0 0 400 250"
          style={{ width: '100%', height: '100%', display: 'block' }}
          preserveAspectRatio="none"
        >
          {/* Dark Background */}
          <rect width="400" height="250" fill="#0f1726" />

          {/* Top Row Items */}
          <g transform="translate(10, 20)">
            {/* Shelf Line 1 */}
            <rect x="0" y="55" width="380" height="6" fill="#334155" rx="1" />
            <rect x="15" y="10" width="22" height="45" fill="#ef4444" rx="3" />
            <rect x="42" y="14" width="20" height="41" fill="#38bdf8" rx="3" />
            <rect x="67" y="8" width="24" height="47" fill="#a855f7" rx="3" />
            <rect x="96" y="16" width="22" height="39" fill="#eab308" rx="3" />
            <rect x="123" y="10" width="22" height="45" fill="#f97316" rx="3" />
            <rect x="150" y="12" width="24" height="43" fill="#3b82f6" rx="3" />
            <rect x="179" y="8" width="22" height="47" fill="#f59e0b" rx="3" />
            <rect x="206" y="15" width="22" height="40" fill="#ec4899" rx="3" />
            <rect x="233" y="10" width="24" height="45" fill="#10b981" rx="3" />
            <rect x="262" y="14" width="22" height="41" fill="#6366f1" rx="3" />
            <rect x="289" y="8" width="24" height="47" fill="#06b6d4" rx="3" />
            <rect x="318" y="12" width="22" height="43" fill="#84cc16" rx="3" />
            <rect x="345" y="16" width="20" height="39" fill="#f43f5e" rx="3" />
          </g>

          {/* Middle Row Items */}
          <g transform="translate(10, 85)">
            {/* Shelf Line 2 */}
            <rect x="0" y="55" width="380" height="6" fill="#334155" rx="1" />
            <rect x="15" y="8" width="26" height="47" fill="#eab308" rx="3" />
            <rect x="46" y="12" width="22" height="43" fill="#06b6d4" rx="3" />
            <rect x="73" y="16" width="24" height="39" fill="#ef4444" rx="3" />
            <rect x="102" y="10" width="26" height="45" fill="#f59e0b" rx="3" />
            <rect x="133" y="8" width="22" height="47" fill="#10b981" rx="3" />
            <rect x="160" y="14" width="26" height="41" fill="#8b5cf6" rx="3" />
            <rect x="191" y="10" width="24" height="45" fill="#3b82f6" rx="3" />
            <rect x="220" y="16" width="22" height="39" fill="#f97316" rx="3" />
            <rect x="247" y="12" width="24" height="43" fill="#14b8a6" rx="3" />
            <rect x="276" y="8" width="26" height="47" fill="#ec4899" rx="3" />
            <rect x="307" y="14" width="22" height="41" fill="#f43f5e" rx="3" />
            <rect x="334" y="10" width="30" height="45" fill="#0284c7" rx="3" />
          </g>

          {/* Bottom Row Items */}
          <g transform="translate(10, 150)">
            {/* Shelf Line 3 */}
            <rect x="0" y="55" width="380" height="6" fill="#334155" rx="1" />
            <rect x="15" y="12" width="24" height="43" fill="#f8fafc" rx="3" />
            <rect x="44" y="10" width="22" height="45" fill="#22c55e" rx="3" />
            <rect x="71" y="8" width="26" height="47" fill="#1e293b" rx="3" />
            <rect x="102" y="15" width="24" height="40" fill="#f8fafc" rx="3" />
            <rect x="131" y="10" width="22" height="45" fill="#ef4444" rx="3" />
            <rect x="158" y="12" width="26" height="43" fill="#eab308" rx="3" />
            <rect x="189" y="8" width="24" height="47" fill="#38bdf8" rx="3" />
            <rect x="218" y="14" width="22" height="41" fill="#a855f7" rx="3" />
            <rect x="245" y="10" width="26" height="45" fill="#f97316" rx="3" />
            <rect x="276" y="16" width="22" height="39" fill="#10b981" rx="3" />
            <rect x="303" y="12" width="24" height="43" fill="#f8fafc" rx="3" />
            <rect x="332" y="8" width="32" height="47" fill="#dc2626" rx="3" />
          </g>
        </svg>

        {/* GPS Coordinate Watermark Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '8px',
            right: '8px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            borderRadius: '4px',
            padding: '4px 8px',
            color: '#f8fafc',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            lineHeight: 1.35,
          }}
        >
          <div style={{ fontWeight: 600, color: '#38bdf8' }}>
            12.9721° N, 77.6414° E · ±6 m
          </div>
          <div style={{ color: '#cbd5e1' }}>
            FreshMart, 100 Ft Rd, Indiranagar · 20 Oct, 11:14 IST
          </div>
        </div>
      </div>

      {/* Thumbnails (for review card mode) */}
      {showThumbnails && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            marginBottom: '0.875rem',
          }}
        >
          {['E1', 'E2', 'E3'].map((item, idx) => (
            <div
              key={item}
              style={{
                background: '#1e293b',
                borderRadius: '6px',
                height: '48px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: idx === 0 ? '2px solid #38bdf8' : '1px solid #334155',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: '4px',
                  fontSize: '0.55rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#94a3b8',
                  fontWeight: 700,
                }}
              >
                {item}
              </div>
              <div
                style={{
                  width: '60%',
                  height: '50%',
                  background: idx === 0 ? '#3b82f6' : idx === 1 ? '#eab308' : '#10b981',
                  borderRadius: '3px',
                  opacity: 0.8,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* AI-Assisted Checks / Verification Details */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.8125rem',
          color: '#334155',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '0.875rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
            <Check size={14} color="#0c7c59" strokeWidth={3} />
            <span>Location</span>
          </span>
          <span style={{ fontWeight: 600, color: '#111315', fontSize: '0.775rem' }}>
            Inside 150 m radius · 18 m from pin
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
            <Check size={14} color="#0c7c59" strokeWidth={3} />
            <span>Captured</span>
          </span>
          <span style={{ fontWeight: 600, color: '#111315', fontSize: '0.775rem' }}>
            20 Oct, 11:14 IST · ±6 m
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
            <Check size={14} color="#0c7c59" strokeWidth={3} />
            <span>Checks</span>
          </span>
          <span style={{ fontWeight: 600, color: '#111315', fontSize: '0.775rem' }}>
            4 of 4 passed
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
            <CheckCircle2 size={14} color="#0c7c59" strokeWidth={2.5} />
            <span>{isApproved ? 'Wallet' : 'Decision'}</span>
          </span>
          <span style={{ fontWeight: 700, color: '#0c7c59', fontSize: '0.8rem' }}>
            {decisionLabel}
          </span>
        </div>
      </div>

      {/* Review Card Action Buttons (Rework / Approve) */}
      {showActions && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.4fr',
            gap: '8px',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <button
            type="button"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Rework
          </button>
          <button
            type="button"
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              background: '#0c7c59',
              color: '#ffffff',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Approve
          </button>
        </div>
      )}

      {/* Footer Caption */}
      <div
        style={{
          marginTop: '0.875rem',
          textAlign: 'center',
          fontSize: '0.675rem',
          color: '#94a3b8',
          letterSpacing: '0.02em',
        }}
      >
        Illustrative task record
      </div>
    </div>
  );
}
