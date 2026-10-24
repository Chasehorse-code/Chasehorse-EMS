import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'chasehorse-theme';

function getStoredTheme(): Theme | null {
  try {
    if (typeof window === 'undefined') return null;
    const val = localStorage.getItem(THEME_STORAGE_KEY);
    if (val === 'light' || val === 'dark' || val === 'system') return val as Theme;
  } catch (err) {
    console.warn('[ThemeContext] LocalStorage read failed:', err);
  }
  return null;
}

function setStoredTheme(theme: Theme): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch (err) {
    console.warn('[ThemeContext] LocalStorage write failed:', err);
  }
}

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to light paper & carbon signature theme
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = getStoredTheme();
    if (saved) return saved;
    return 'light';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemPreference());
  const initialMountRef = useRef(true);

  // Listen to system preference changes if in 'system' mode
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme;

  // Apply data-theme attribute on <html> with temporary "theming" class for ~450ms cross-fade
  useEffect(() => {
    const root = document.documentElement;

    if (!initialMountRef.current) {
      root.classList.add('theming');
      const timer = window.setTimeout(() => {
        root.classList.remove('theming');
      }, 450);

      root.setAttribute('data-theme', resolvedTheme);
      return () => {
        window.clearTimeout(timer);
        root.classList.remove('theming');
      };
    } else {
      initialMountRef.current = false;
      root.setAttribute('data-theme', resolvedTheme);
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);
  };

  const toggleTheme = () => {
    const next: 'light' | 'dark' = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
