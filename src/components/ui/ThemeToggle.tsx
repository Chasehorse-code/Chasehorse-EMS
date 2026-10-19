import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <Sun
          size={18}
          className={`theme-toggle__icon theme-toggle__icon--sun ${
            isDark ? 'theme-toggle__icon--hidden' : 'theme-toggle__icon--active'
          }`}
        />
        <Moon
          size={18}
          className={`theme-toggle__icon theme-toggle__icon--moon ${
            isDark ? 'theme-toggle__icon--active' : 'theme-toggle__icon--hidden'
          }`}
        />
      </span>
    </button>
  );
}
