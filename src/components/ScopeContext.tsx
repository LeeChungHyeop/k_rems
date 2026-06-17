import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { ScopeQuery } from './ScopeFilter';
import { defaultScope } from './ScopeFilter';

const KEY = 'k-rems-global-scope-v1';

type Ctx = { scope: ScopeQuery; setScope: (q: ScopeQuery) => void };
const ScopeCtx = createContext<Ctx | null>(null);

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScopeState] = useState<ScopeQuery>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as ScopeQuery;
    } catch {}
    return defaultScope();
  });
  const setScope = (q: ScopeQuery) => {
    setScopeState(q);
    try { localStorage.setItem(KEY, JSON.stringify(q)); } catch {}
  };
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(scope)); } catch {}
  }, [scope]);
  return <ScopeCtx.Provider value={{ scope, setScope }}>{children}</ScopeCtx.Provider>;
}

export function useScope(): Ctx {
  const c = useContext(ScopeCtx);
  if (!c) throw new Error('useScope must be used inside ScopeProvider');
  return c;
}
