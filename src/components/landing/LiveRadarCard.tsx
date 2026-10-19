import React, { useState } from 'react';
import { Sparkles, Navigation } from 'lucide-react';

export function LiveRadarCard() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    // Slight tilt (up to 8 degrees) that flattens on hover
    setTilt({ x: -(y * 6), y: x * 6 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      className={`radar-card-container ${isHovered ? 'radar-card-container--hover' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(-4px)'
          : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      <div className="radar-card">
        {/* Radar Card Header */}
        <div className="radar-card__header">
          <div className="radar-card__beacon">
            <span className="beacon-pulse" aria-hidden="true" />
            <span className="beacon-dot" aria-hidden="true" />
            <span className="radar-card__title">LIVE TASK RADIUS</span>
          </div>
          <div className="radar-card__sample-badge">
            Sample
          </div>
        </div>

        {/* Radar Map Graphic Viewport */}
        <div className="radar-map-viewport">
          <svg
            className="radar-svg-map"
            viewBox="0 0 460 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Interactive map showing 2km radius and nearby field tasks"
            role="img"
          >
            {/* Background Grid Lines */}
            <defs>
              <pattern id="radarGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="var(--line)" strokeWidth="0.8" strokeOpacity="0.6" />
              </pattern>
              <radialGradient id="radarScanGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.18" />
                <stop offset="60%" stopColor="var(--blue)" stopOpacity="0.06" />
                <stop offset="100%" stopColor="var(--blue)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--line)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--line)" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            <rect width="100%" height="100%" fill="url(#radarGrid)" />

            {/* Stylized Road Network Curves */}
            <path d="M -20 180 Q 140 160 230 180 T 480 200" stroke="url(#roadGrad)" strokeWidth="6" strokeLinecap="round" />
            <path d="M 230 -20 Q 240 120 230 180 T 210 380" stroke="url(#roadGrad)" strokeWidth="6" strokeLinecap="round" />
            <path d="M 60 40 Q 180 120 380 280" stroke="url(#roadGrad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6" />
            <path d="M 40 320 Q 160 260 420 80" stroke="url(#roadGrad)" strokeWidth="2.5" strokeLinecap="round" />

            {/* Pulsing Concentric Radar Rings */}
            <circle cx="230" cy="180" r="140" fill="url(#radarScanGradient)" />
            <circle cx="230" cy="180" r="135" stroke="var(--blue)" strokeWidth="1.5" strokeDasharray="5 5" strokeOpacity="0.65" />
            <circle cx="230" cy="180" r="90" stroke="var(--blue)" strokeWidth="1" strokeOpacity="0.4" className="radar-pulse-ring-1" />
            <circle cx="230" cy="180" r="140" stroke="var(--blue)" strokeWidth="1" strokeOpacity="0.3" className="radar-pulse-ring-2" />

            {/* Radius Distance Label */}
            <text x="238" y="55" fill="var(--muted)" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.05em">
              2.0 KM BOUNDARY
            </text>

            {/* Task Pin 1 (Active ₹450) */}
            <g transform="translate(130, 110)" className="radar-pin">
              <circle cx="0" cy="0" r="16" fill="var(--blue-soft)" />
              <rect x="-30" y="-36" width="60" height="24" rx="12" fill="var(--blue)" />
              <text x="0" y="-20" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="var(--font-mono)" textAnchor="middle">
                ₹450
              </text>
              <circle cx="0" cy="0" r="5" fill="var(--blue)" />
            </g>

            {/* Task Pin 2 (Completed ₹300 in Green) */}
            <g transform="translate(320, 130)" className="radar-pin radar-pin--completed">
              <circle cx="0" cy="0" r="16" fill="var(--good-soft)" />
              <rect x="-38" y="-36" width="76" height="24" rx="12" fill="var(--good)" />
              <text x="-4" y="-20" fill="#ffffff" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)" textAnchor="middle">
                ✓ ₹300
              </text>
              <circle cx="0" cy="0" r="5" fill="var(--good)" />
            </g>

            {/* Task Pin 3 (Active ₹600) */}
            <g transform="translate(290, 260)" className="radar-pin">
              <circle cx="0" cy="0" r="16" fill="var(--blue-soft)" />
              <rect x="-30" y="-36" width="60" height="24" rx="12" fill="var(--blue)" />
              <text x="0" y="-20" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="var(--font-mono)" textAnchor="middle">
                ₹600
              </text>
              <circle cx="0" cy="0" r="5" fill="var(--blue)" />
            </g>

            {/* Center "YOU" Marker with Radar Target Dot */}
            <g transform="translate(230, 180)">
              <circle cx="0" cy="0" r="18" fill="var(--blue)" fillOpacity="0.2" className="you-pulse" />
              <circle cx="0" cy="0" r="9" fill="var(--surface)" stroke="var(--blue)" strokeWidth="3" />
              <circle cx="0" cy="0" r="4" fill="var(--blue)" />
              <rect x="-18" y="14" width="36" height="18" rx="4" fill="var(--ink)" />
              <text x="0" y="27" fill="#ffffff" fontSize="10" fontWeight="700" fontFamily="var(--font-heading)" textAnchor="middle">
                YOU
              </text>
            </g>
          </svg>

          {/* Floating Mini Task Card */}
          <div className="floating-mini-task-card" role="region" aria-label="Task preview snippet">
            <div className="mini-task-card__top">
              <div className="mini-task-card__title-group">
                <span className="mini-task-card__title">Shelf audit · Aisle 4</span>
                <span className="mini-task-card__reward">₹450</span>
              </div>
            </div>

            <div className="mini-task-card__progress-wrap">
              <div className="mini-task-card__progress-bar">
                <div className="mini-task-card__progress-fill" style={{ width: '84%' }} />
              </div>
              <span className="mini-task-card__pct">84%</span>
            </div>

            <div className="mini-task-card__ai-badge">
              <Sparkles size={13} className="mini-task-card__ai-sparkle" />
              <span>Gemini matched photo to checklist</span>
            </div>
          </div>
        </div>

        {/* Radar Card Footer Row */}
        <div className="radar-card__footer">
          <span className="radar-stat-item">
            <strong>Radius:</strong> 2.0 km
          </span>
          <span className="radar-stat-divider" aria-hidden="true">·</span>
          <span className="radar-stat-item">
            <strong>In Range:</strong> 3 tasks
          </span>
          <span className="radar-stat-divider" aria-hidden="true">·</span>
          <span className="radar-stat-item radar-stat-item--gps">
            <Navigation size={12} className="radar-gps-icon" /> GPS ±8 m
          </span>
        </div>
      </div>
    </div>
  );
}
