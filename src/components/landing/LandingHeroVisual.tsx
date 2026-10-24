import {
  Clock,
  ScanLine,
  SlidersHorizontal,
} from 'lucide-react';
import { TaskAuditPreviewCard } from './TaskAuditPreviewCard';

export function LandingHeroVisual() {
  return (
    <div
      className="landing-hero-visual"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '680px',
        margin: '0 auto',
      }}
    >
      {/* 1. Underlying Base: Operations Board Map Card */}
      <div
        className="hero-map-card"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          width: '92%',
          marginLeft: 'auto',
          position: 'relative',
        }}
      >
        {/* Map Header */}
        <div
          style={{
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#111315',
                borderRadius: '1px',
              }}
            />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111315' }}>
              Operations board
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', marginLeft: '4px' }}>
              Bengaluru East · Today
            </span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '5px 10px',
              borderRadius: '6px',
              background: '#f1f5f9',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={12} />
            <span>All statuses</span>
          </div>
        </div>

        {/* Map Body Graphic */}
        <div
          style={{
            position: 'relative',
            height: '380px',
            background: '#e9ecef',
            overflow: 'hidden',
          }}
        >
          {/* Stylized Street Grid SVG */}
          <svg
            viewBox="0 0 600 380"
            style={{ width: '100%', height: '100%', display: 'block' }}
            preserveAspectRatio="none"
          >
            {/* Background Blocks */}
            <rect width="600" height="380" fill="#e2e8f0" />
            <rect x="20" y="20" width="120" height="90" fill="#f1f5f9" rx="4" />
            <rect x="160" y="20" width="130" height="90" fill="#f1f5f9" rx="4" />
            <rect x="310" y="20" width="120" height="90" fill="#f1f5f9" rx="4" />
            <rect x="450" y="20" width="130" height="90" fill="#f1f5f9" rx="4" />

            <rect x="20" y="130" width="120" height="100" fill="#f1f5f9" rx="4" />
            <rect x="160" y="130" width="130" height="100" fill="#f1f5f9" rx="4" />
            <rect x="310" y="130" width="120" height="100" fill="#f1f5f9" rx="4" />
            <rect x="450" y="130" width="130" height="100" fill="#f1f5f9" rx="4" />

            <rect x="20" y="250" width="120" height="110" fill="#f1f5f9" rx="4" />
            <rect x="160" y="250" width="130" height="110" fill="#f1f5f9" rx="4" />
            <rect x="310" y="250" width="120" height="110" fill="#f1f5f9" rx="4" />
            <rect x="450" y="250" width="130" height="110" fill="#f1f5f9" rx="4" />

            {/* Roads */}
            <path
              d="M 0 120 L 600 120 M 0 240 L 600 240 M 150 0 L 150 380 M 300 0 L 300 380 M 440 0 L 440 380"
              stroke="#ffffff"
              strokeWidth="14"
            />
            <path
              d="M 0 120 L 600 120 M 0 240 L 600 240 M 150 0 L 150 380 M 300 0 L 300 380 M 440 0 L 440 380"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            {/* Geofence Circular Radius */}
            <circle
              cx="330"
              cy="165"
              r="68"
              fill="rgba(235, 87, 36, 0.08)"
              stroke="#eb5724"
              strokeWidth="1.75"
              strokeDasharray="5 4"
            />

            {/* Field Task Location Pins */}
            <rect x="180" y="60" width="14" height="14" fill="none" stroke="#059669" strokeWidth="2.5" rx="2" />
            <rect x="420" y="70" width="14" height="14" fill="none" stroke="#059669" strokeWidth="2.5" rx="2" />
            <rect x="420" y="280" width="14" height="14" fill="none" stroke="#059669" strokeWidth="2.5" rx="2" />
            <rect x="210" y="310" width="14" height="14" fill="none" stroke="#2563eb" strokeWidth="2.5" rx="2" />

            {/* Center Pin Target with Pulse */}
            <g transform="translate(320, 155)">
              <rect x="0" y="0" width="20" height="20" fill="#eb5724" rx="3" />
              <rect x="4" y="4" width="12" height="12" fill="#ffffff" rx="2" />
              <circle cx="10" cy="10" r="3" fill="#eb5724" />
            </g>
          </svg>

          {/* Floating Task Callout Badge: CH-24817 · 18 m */}
          <div
            style={{
              position: 'absolute',
              top: '125px',
              left: '350px',
              background: '#111315',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              zIndex: 3,
            }}
          >
            <span>CH-24817</span>
            <span style={{ color: '#94a3b8' }}>·</span>
            <span style={{ fontWeight: 700 }}>18 m</span>
          </div>

          {/* Map Footer Legend */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(6px)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: '#334155',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#059669', borderRadius: '1px' }} />
              Approved
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#d97706', borderRadius: '1px' }} />
              In review
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#2563eb', borderRadius: '1px' }} />
              On site
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#64748b', borderRadius: '1px' }} />
              Open
            </span>
          </div>
        </div>
      </div>

      {/* 2. Overlaid Left: Mobile Phone Field App Mockup */}
      <div
        className="hero-phone-mockup"
        style={{
          position: 'absolute',
          top: '35px',
          left: '0',
          width: '260px',
          background: '#ffffff',
          borderRadius: '32px',
          border: '7px solid #111315',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          zIndex: 4,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {/* Dynamic Island / Notch Bar */}
        <div
          style={{
            height: '24px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            fontSize: '0.625rem',
            fontWeight: 700,
            color: '#111315',
            borderBottom: '1px solid #f8fafc',
          }}
        >
          <span>11:14</span>
          {/* Pill notch */}
          <div
            style={{
              width: '54px',
              height: '10px',
              borderRadius: '10px',
              background: '#111315',
            }}
          />
          <span>4G</span>
        </div>

        {/* Phone Content Screen */}
        <div style={{ padding: '16px 14px 20px 14px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#111315',
              marginBottom: '2px',
            }}
          >
            Submitted
          </div>
          <div
            style={{
              fontSize: '0.675rem',
              color: '#64748b',
              marginBottom: '24px',
            }}
          >
            CH-24817 · 3 photos
          </div>

          {/* Central Clock Circle */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <Clock size={30} strokeWidth={2} />
          </div>

          <div
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: '#111315',
              marginBottom: '6px',
            }}
          >
            With operations
          </div>
          <div
            style={{
              fontSize: '0.725rem',
              color: '#64748b',
              lineHeight: 1.45,
              padding: '0 8px',
              marginBottom: '32px',
            }}
          >
            ₹450 is held until a reviewer approves your evidence.
          </div>

          {/* Bottom Running Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '20px',
              background: '#f1f5f9',
              fontSize: '0.675rem',
              fontWeight: 600,
              color: '#475569',
              border: '1px solid #e2e8f0',
            }}
          >
            <ScanLine size={13} />
            <span>Automated checks running</span>
          </div>
        </div>
      </div>

      {/* 3. Overlaid Right: Review Queue Card */}
      <div
        className="hero-review-card"
        style={{
          position: 'absolute',
          top: '20px',
          right: '-10px',
          width: '350px',
          zIndex: 5,
        }}
      >
        <TaskAuditPreviewCard
          status="review"
          showThumbnails={true}
          showActions={true}
          decisionLabel="AI verification pass"
        />
      </div>

      {/* 4. Bottom Captions matching Screenshot 3 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1.25rem',
          padding: '0 8px',
          fontSize: '0.75rem',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', fontWeight: 600 }}>
          <span>01 Capture on site</span>
          <span>02 Automated checks + review</span>
          <span>03 Approve and reward</span>
        </div>
      </div>
      <div
        style={{
          fontSize: '0.6875rem',
          color: '#94a3b8',
          textAlign: 'left',
          padding: '4px 8px 0 8px',
        }}
      >
        Illustrative interface with sample data.
      </div>
    </div>
  );
}
