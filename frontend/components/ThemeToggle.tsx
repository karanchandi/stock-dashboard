'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const saved = localStorage.getItem('mp_theme') as 'light' | 'dark' | 'system' | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  function applyTheme(t: 'light' | 'dark' | 'system') {
    const root = document.documentElement;
    if (t === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', t);
    }
  }

  function cycle() {
    const next = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('mp_theme', next);
  }

  const icon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '⚙️';
  const label = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'Auto';

  return (
    <button
      onClick={cycle}
      className="px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
      title={`Theme: ${label}`}
    >
      <span style={{ fontSize: 11 }}>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
