import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
type Theme = 'light' | 'dark';
function initialTheme(): Theme {
  const initialized = document.documentElement.dataset.theme;
  if (initialized === 'light' || initialized === 'dark') return initialized;
  try {
    const saved = localStorage.getItem('ps5-hub-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* Storage is optional. */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  function choose(next: Theme) {
    setTheme(next);
    try {
      localStorage.setItem('ps5-hub-theme', next);
    } catch {
      /* Keep switching functional without storage. */
    }
  }
  return (
    <div className="theme-switcher" role="group" aria-label="外观主题">
      <button
        type="button"
        aria-label="浅色主题"
        aria-pressed={theme === 'light'}
        onClick={() => choose('light')}
      >
        <Sun size={16} aria-hidden="true" />
        <span>浅色</span>
      </button>
      <button
        type="button"
        aria-label="深色主题"
        aria-pressed={theme === 'dark'}
        onClick={() => choose('dark')}
      >
        <Moon size={16} aria-hidden="true" />
        <span>深色</span>
      </button>
    </div>
  );
}
