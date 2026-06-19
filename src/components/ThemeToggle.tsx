import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const KEY = 'k-rems-theme';
type Theme = 'light' | 'dark';

function getInitial(): Theme {
  try {
    const saved = localStorage.getItem(KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return document.documentElement.classList.contains('dark') ? 'dark' : 'dark';
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const [theme, setTheme] = useState<Theme>(getInitial);

  useEffect(() => {
    apply(theme);
    try { localStorage.setItem(KEY, theme); } catch {}
  }, [theme]);

  const isDark = theme === 'dark';

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="mx-auto p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
        title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <div className="px-2 py-2">
      <div className="flex items-center rounded-md border border-sidebar-border bg-sidebar-accent/30 p-0.5 text-[11px] font-medium">
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded transition-colors ${
            !isDark ? 'bg-sidebar text-sidebar-foreground shadow-sm' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
          }`}
        >
          <Sun className="h-3 w-3" /> 라이트
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded transition-colors ${
            isDark ? 'bg-sidebar text-sidebar-foreground shadow-sm' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
          }`}
        >
          <Moon className="h-3 w-3" /> 다크
        </button>
      </div>
    </div>
  );
}
