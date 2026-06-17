import { useMemo, useState } from 'react';
import { PLANTS, PLANT_GROUPS, OPERATORS, ENERGY_LABEL } from '@/data/mockData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Filter, Search, RotateCcw, ChevronDown } from 'lucide-react';

export type ScopeKind = 'plant' | 'operator' | 'group';

export interface ScopeQuery {
  kind: ScopeKind;
  ids: string[];
}

export function defaultScope(): ScopeQuery {
  return { kind: 'plant', ids: [] };
}

export function plantsForScope(q: ScopeQuery) {
  if (q.kind === 'plant') {
    if (!q.ids.length) return PLANTS;
    return PLANTS.filter(p => q.ids.includes(p.id));
  }
  if (q.kind === 'operator') {
    const ids = q.ids.length ? q.ids : OPERATORS.map(o => o.id);
    return PLANTS.filter(p => ids.includes(p.operatorId));
  }
  const groups = q.ids.length ? PLANT_GROUPS.filter(g => q.ids.includes(g.id)) : PLANT_GROUPS;
  const pids = new Set<string>();
  groups.forEach(g => g.plantIds.forEach(id => pids.add(id)));
  return PLANTS.filter(p => pids.has(p.id));
}

const KIND_LABEL: Record<ScopeKind, string> = { plant: '발전소별', operator: '담당자별', group: '그룹별' };
const KIND_TABS: ScopeKind[] = ['plant', 'group', 'operator'];

export function ScopeFilter({
  value, onApply, title = '구분', inline = false,
}: {
  value: ScopeQuery;
  onApply: (q: ScopeQuery) => void;
  title?: string;
  inline?: boolean;
}) {
  const [kw, setKw] = useState('');

  const options = useMemo(() => {
    if (value.kind === 'plant') return PLANTS.map(p => ({ id: p.id, label: `[${ENERGY_LABEL[p.type]}] ${p.name}` }));
    if (value.kind === 'operator') return OPERATORS.map(o => ({ id: o.id, label: `${o.name} (${o.region})` }));
    return PLANT_GROUPS.map(g => ({ id: g.id, label: `[${g.type.toUpperCase()}] ${g.name}` }));
  }, [value.kind]);

  const filtered = useMemo(
    () => kw ? options.filter(o => o.label.toLowerCase().includes(kw.toLowerCase())) : options,
    [options, kw]
  );

  const setKind = (k: ScopeKind) => onApply({ kind: k, ids: [] });
  const toggle = (id: string) => {
    const ids = value.ids.includes(id) ? value.ids.filter(x => x !== id) : [...value.ids, id];
    onApply({ ...value, ids });
  };
  const reset = () => onApply({ kind: value.kind, ids: [] });

  const summary = value.ids.length === 0 ? '전체' : `${value.ids.length}건`;

  return (
    <div className={inline ? '' : 'mb-3'}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 h-9">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-medium">{title}</span>
            <span className="text-muted-foreground text-[11px]">· {KIND_LABEL[value.kind]} · {summary}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="flex gap-1 mb-2">
              {KIND_TABS.map(k => (
                <Button
                  key={k}
                  size="sm"
                  variant={value.kind === k ? 'default' : 'ghost'}
                  className="h-7 text-[11px] flex-1"
                  onClick={() => setKind(k)}
                >
                  {KIND_LABEL[k]}
                </Button>
              ))}
            </div>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2 top-2 text-muted-foreground" />
              <Input
                value={kw} onChange={(e) => setKw(e.target.value)}
                placeholder="검색"
                className="h-8 pl-7 text-xs"
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-auto p-2">
            {filtered.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-6">결과 없음</div>
            ) : filtered.map(o => (
              <label key={o.id} className="flex items-center gap-2 text-xs hover:bg-muted/50 px-2 py-1.5 rounded cursor-pointer">
                <Checkbox checked={value.ids.includes(o.id)} onCheckedChange={() => toggle(o.id)} />
                <span className="truncate">{o.label}</span>
              </label>
            ))}
          </div>
          <div className="p-2 border-t flex items-center justify-between bg-muted/30">
            <span className="text-[11px] text-muted-foreground pl-1">선택 안하면 전체 조회</span>
            <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1" onClick={reset}>
              <RotateCcw className="h-3 w-3" /> 선택 초기화
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
