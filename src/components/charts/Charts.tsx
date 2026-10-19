import type { Tone } from '@/utils/labels';

/* Lightweight, dependency-free charts. Swap for a chart library later if needed. */

export interface BarDatum {
  label: string;
  value: number;
  tone: Tone;
}

export function BarList({ data, ariaLabel }: { data: BarDatum[]; ariaLabel: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="barlist" aria-label={ariaLabel}>
      {data.map((d) => (
        <li key={d.label} className="barlist__row">
          <span className="barlist__label">{d.label}</span>
          <span className="barlist__track" aria-hidden>
            <span className={`barlist__fill barlist__fill--${d.tone}`} style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
          <span className="barlist__value">{d.value}</span>
        </li>
      ))}
    </ul>
  );
}

export interface TrendPoint {
  day: string;
  created: number;
  completed: number;
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const W = 560;
  const H = 200;
  const pad = { l: 28, r: 24, t: 12, b: 26 };
  const max = Math.max(4, ...data.flatMap((d) => [d.created, d.completed]));
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (data.length - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const path = (key: 'created' | 'completed') => data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');
  const ticks = [0, Math.round(max / 2), max];

  return (
    <figure className="trend">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="trend-title trend-desc" className="trend__svg">
        <title id="trend-title">Tasks created and completed, last 14 days (demo data)</title>
        <desc id="trend-desc">
          Line chart with two series. Created ranges from {Math.min(...data.map((d) => d.created))} to {Math.max(...data.map((d) => d.created))}; completed ranges from{' '}
          {Math.min(...data.map((d) => d.completed))} to {Math.max(...data.map((d) => d.completed))}.
        </desc>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="trend__grid" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="trend__tick">{t}</text>
          </g>
        ))}
        {data.map((d, i) =>
          i % 3 === 0 || i === data.length - 1 ? (
            <text key={d.day} x={x(i)} y={H - 6} textAnchor="middle" className="trend__tick">{d.day}</text>
          ) : null,
        )}
        <path d={path('created')} className="trend__line trend__line--created" />
        <path d={path('completed')} className="trend__line trend__line--completed" />
        {data.map((d, i) => (
          <g key={d.day}>
            <circle cx={x(i)} cy={y(d.created)} r="3" className="trend__dot trend__dot--created" />
            <circle cx={x(i)} cy={y(d.completed)} r="3" className="trend__dot trend__dot--completed" />
          </g>
        ))}
      </svg>
      <figcaption className="trend__legend">
        <span><i className="swatch swatch--created" aria-hidden /> Created</span>
        <span><i className="swatch swatch--completed" aria-hidden /> Completed</span>
      </figcaption>
    </figure>
  );
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  data,
  total,
  centerLabel = 'Total Tasks',
  size = 190,
  strokeWidth = 24,
}: {
  data: DonutSegment[];
  total: number;
  centerLabel?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = total > 0 ? total : 1;

  let accumulated = 0;
  const segments = data.map((d) => {
    const fraction = d.value / safeTotal;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulated * circumference;
    accumulated += fraction;
    return { ...d, strokeDasharray, strokeDashoffset };
  });

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} role="img" aria-label={`Task distribution donut chart. Total: ${total}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border, rgba(255, 255, 255, 0.08))"
          strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {total > 0 &&
          segments.map((seg, i) =>
            seg.value > 0 ? (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease' }}
              />
            ) : null,
          )}
      </svg>
      {/* Center Label */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text, #f8fafc)', lineHeight: 1.1 }}>
          {total}
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted, #94a3b8)', marginTop: '2px' }}>
          {centerLabel}
        </span>
      </div>
    </div>
  );
}

