import { initials } from '@/utils/format';

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  // Deterministic tint from the name so the same person always looks the same.
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <span
      className="avatar"
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 45% 92%)`, color: `hsl(${hue} 50% 28%)` }}
    >
      {initials(name)}
    </span>
  );
}
