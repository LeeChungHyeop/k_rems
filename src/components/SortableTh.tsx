import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDir = 'asc' | 'desc' | null;
export type SortState<K extends string> = { key: K | null; dir: SortDir };

export function nextSort<K extends string>(state: SortState<K>, key: K): SortState<K> {
  if (state.key !== key) return { key, dir: 'asc' };
  if (state.dir === 'asc') return { key, dir: 'desc' };
  return { key: null, dir: null };
}

export function applySort<T, K extends string>(
  arr: T[],
  state: SortState<K>,
  accessor: (row: T, key: K) => string | number | null | undefined,
): T[] {
  if (!state.key || !state.dir) return arr;
  const k = state.key;
  const dir = state.dir === 'asc' ? 1 : -1;
  return [...arr].sort((a, b) => {
    const av = accessor(a, k);
    const bv = accessor(b, k);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv), 'ko') * dir;
  });
}

interface Props<K extends string> {
  label: React.ReactNode;
  k: K;
  state: SortState<K>;
  onSort: (key: K) => void;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export function SortableTh<K extends string>({ label, k, state, onSort, align = 'left', className }: Props<K>) {
  const active = state.key === k;
  const Icon = !active ? ArrowUpDown : state.dir === 'asc' ? ArrowUp : ArrowDown;
  const just = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';
  return (
    <th className={cn('px-3 py-2', align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left', className)}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn('inline-flex items-center gap-1 hover:text-primary transition-colors w-full', just, active && 'text-primary font-semibold')}
      >
        <span>{label}</span>
        <Icon className={cn('h-3 w-3 shrink-0', active ? 'opacity-100' : 'opacity-40')} />
      </button>
    </th>
  );
}
