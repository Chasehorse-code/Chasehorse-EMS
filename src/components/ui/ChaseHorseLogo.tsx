export interface ChaseHorseLogoProps {
  className?: string;
  theme?: 'dark' | 'light' | 'auto'; // 'dark' = for dark bg (white text), 'light' = for light bg (black text)
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withSubtitle?: boolean;
}

export function ChaseHorseLogo({
  className = '',
  theme = 'auto',
  size = 'md',
  withSubtitle = false,
}: ChaseHorseLogoProps) {
  const sizeStyles: Record<string, { fontSize: string; letterSpacing: string; subSize: string; gap: string }> = {
    sm: { fontSize: '1rem', letterSpacing: '0.07em', subSize: '0.55rem', gap: '2px' },
    md: { fontSize: '1.25rem', letterSpacing: '0.08em', subSize: '0.625rem', gap: '3px' },
    lg: { fontSize: '1.5rem', letterSpacing: '0.09em', subSize: '0.7rem', gap: '4px' },
    xl: { fontSize: '1.85rem', letterSpacing: '0.1em', subSize: '0.75rem', gap: '5px' },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  const textColor =
    theme === 'dark'
      ? '#ffffff'
      : theme === 'light'
      ? '#111315'
      : 'var(--ink)';

  const subColor =
    theme === 'dark'
      ? '#9ca3af'
      : theme === 'light'
      ? '#6b7280'
      : 'var(--text-muted)';

  return (
    <div
      className={`chasehorse-brand-wrap ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: currentSize.gap,
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          className="chasehorse-wordmark"
          style={{
            fontFamily: 'var(--font-logo), "Orbitron", "Chakra Petch", sans-serif',
            fontWeight: 800,
            fontSize: currentSize.fontSize,
            letterSpacing: currentSize.letterSpacing,
            color: textColor,
            textTransform: 'uppercase',
            display: 'inline-block',
          }}
        >
          CHASEHORSE
        </span>
      </div>

      {withSubtitle && (
        <span
          className="chasehorse-tagline"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: currentSize.subSize,
            fontWeight: 600,
            letterSpacing: '0.16em',
            color: subColor,
            textTransform: 'uppercase',
            marginTop: '2px',
          }}
        >
          GROWTH ENABLING LOGIWORX PARTNER
        </span>
      )}
    </div>
  );
}

export function ChaseHorseWordmark(props: ChaseHorseLogoProps) {
  return <ChaseHorseLogo {...props} />;
}
