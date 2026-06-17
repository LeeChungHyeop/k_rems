import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { PLANTS, type Plant } from '@/data/mockData';

const KEY = 'k-rems-plant-order-v1';

type Ctx = {
  order: string[]; // plant ids in user-defined order
  setOrder: (ids: string[]) => void;
  reorder: (sourceId: string, targetId: string) => void;
  sortPlants: <T extends { id: string }>(arr: T[]) => T[];
  resetOrder: () => void;
};

const PlantOrderCtx = createContext<Ctx | null>(null);

function loadOrder(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      const ids = new Set(PLANTS.map(p => p.id));
      const cleaned = parsed.filter(id => ids.has(id));
      // append any missing plants at the end
      PLANTS.forEach(p => { if (!cleaned.includes(p.id)) cleaned.push(p.id); });
      return cleaned;
    }
  } catch {}
  return PLANTS.map(p => p.id);
}

export function PlantOrderProvider({ children }: { children: ReactNode }) {
  const [order, setOrderState] = useState<string[]>(() => loadOrder());

  const persist = (ids: string[]) => {
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch {}
  };

  const setOrder = useCallback((ids: string[]) => {
    setOrderState(ids);
    persist(ids);
  }, []);

  const reorder = useCallback((sourceId: string, targetId: string) => {
    setOrderState(prev => {
      const next = [...prev];
      const from = next.indexOf(sourceId);
      const to = next.indexOf(targetId);
      if (from < 0 || to < 0 || from === to) return prev;
      next.splice(from, 1);
      next.splice(to, 0, sourceId);
      persist(next);
      return next;
    });
  }, []);

  const sortPlants = useCallback(<T extends { id: string }>(arr: T[]): T[] => {
    const rank = new Map(order.map((id, i) => [id, i]));
    return [...arr].sort((a, b) => (rank.get(a.id) ?? 9999) - (rank.get(b.id) ?? 9999));
  }, [order]);

  const resetOrder = useCallback(() => {
    const ids = PLANTS.map(p => p.id);
    setOrderState(ids);
    persist(ids);
  }, []);

  return (
    <PlantOrderCtx.Provider value={{ order, setOrder, reorder, sortPlants, resetOrder }}>
      {children}
    </PlantOrderCtx.Provider>
  );
}

export function usePlantOrder(): Ctx {
  const c = useContext(PlantOrderCtx);
  if (!c) throw new Error('usePlantOrder must be used inside PlantOrderProvider');
  return c;
}
