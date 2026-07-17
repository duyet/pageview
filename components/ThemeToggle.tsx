'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Light/dark theme toggle.
 *
 * The current theme class is applied before paint by the inline script in
 * app/layout.tsx (reading localStorage, falling back to system preference);
 * this button just flips the class and persists the choice.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // Ignore storage failures (private browsing, etc.)
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="size-9 text-muted-foreground hover:text-foreground"
    >
      {/* Render both icons and cross-fade so the swap animates */}
      <span className="relative flex size-4 items-center justify-center">
        <Sun
          className={`absolute size-4 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
            mounted && isDark
              ? 'scale-[0.25] opacity-0 blur-[4px]'
              : 'scale-100 opacity-100 blur-0'
          }`}
        />
        <Moon
          className={`absolute size-4 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
            mounted && isDark
              ? 'scale-100 opacity-100 blur-0'
              : 'scale-[0.25] opacity-0 blur-[4px]'
          }`}
        />
      </span>
    </Button>
  );
}
