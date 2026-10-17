export function Meter({ value, label, tone = 'ai' }: { value: number; label: string; tone?: 'ai' | 'success' | 'warning' | 'danger' }) {
  const pct = Math.round(value * 100);
  return (
    <div className="meter">
      <div className="meter__track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className={`meter__fill meter__fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="meter__value">{pct}%</span>
    </div>
  );
}
