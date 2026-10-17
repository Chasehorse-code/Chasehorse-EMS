import { useId } from 'react';

/**
 * Generated stand-in for a field photo. Real photos would come from object
 * storage (e.g. Supabase Storage) via signed URLs returned by the API.
 */
export function PhotoPlaceholder({ hue, caption }: { hue: number; caption: string }) {
  const gid = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg viewBox="0 0 320 200" className="photo" role="img" aria-label={`Demo placeholder image: ${caption}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 40% 82%)`} />
          <stop offset="1" stopColor={`hsl(${(hue + 40) % 360} 38% 62%)`} />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${gid})`} />
      <g fill="rgba(255,255,255,.45)">
        <rect x="28" y="40" width="264" height="10" rx="3" />
        <rect x="28" y="84" width="264" height="10" rx="3" />
        <rect x="28" y="128" width="264" height="10" rx="3" />
      </g>
      <g fill="rgba(20,30,50,.28)">
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3, 4].map((col) => (
            <rect key={`${row}-${col}`} x={38 + col * 52} y={row * 44 + 16} width="34" height="24" rx="3" />
          )),
        )}
      </g>
      <rect x="10" y="168" width="108" height="22" rx="11" fill="rgba(15,25,45,.72)" />
      <text x="64" y="183" textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff" fontFamily="system-ui, sans-serif">
        DEMO IMAGE
      </text>
    </svg>
  );
}
