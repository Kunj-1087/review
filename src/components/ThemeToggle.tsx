'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getAriaLabel = () => {
    if (theme === 'light') return 'Current theme: Light. Click to switch to Dark mode.';
    if (theme === 'dark') return 'Current theme: Dark. Click to switch to System preference.';
    return `Current theme: System (${resolvedTheme}). Click to switch to Light mode.`;
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
      className="p-2 rounded-md bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] transition-colors flex items-center justify-center shrink-0 min-w-[34px] min-h-[34px]"
    >
      {!mounted ? (
        <span className="w-4 h-4 inline-block" />
      ) : (
        <>
          {theme === 'light' && <Sun className="w-4 h-4 text-[var(--color-accent)]" />}
          {theme === 'dark' && <Moon className="w-4 h-4 text-[var(--color-accent)]" />}
          {theme === 'system' && <Laptop className="w-4 h-4 text-[var(--color-text-secondary)]" />}
        </>
      )}
    </button>
  );
}
