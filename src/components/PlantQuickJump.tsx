import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PLANTS, ENERGY_LABEL } from '@/data/mockData';
import { ChevronDown, Search, ExternalLink, Zap } from 'lucide-react';

export function PlantQuickJump() {
  const navigate = useNavigate();
  const [kw, setKw] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = [...PLANTS].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    if (!kw.trim()) return list;
    const k = kw.toLowerCase();
    return list.filter(
      p => p.name.toLowerCase().includes(k) || p.region.toLowerCase().includes(k),
    );
  }, [kw]);

  const go = (id: string) => {
    setOpen(false);
    navigate(`/plant/${id}`);
  };

  const openNew = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const base = window.location.href.split('#')[0];
    window.open(`${base}#/plant/${id}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-9">
          <Zap className="h-3.5 w-3.5" />
          <span className="font-medium hidden sm:inline">발전소 바로가기</span>
          <span className="font-medium sm:hidden">발전소</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(360px,calc(100vw-1rem))] p-0" align="end">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2 top-2.5 text-muted-foreground" />
            <Input
              autoFocus
              value={kw}
              onChange={(e) => setKw(e.target.value)}
              placeholder="발전소명 / 지역 검색"
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>
        <div className="max-h-[360px] overflow-auto">
          {filtered.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">결과 없음</div>
          ) : (
            <ul className="py-1">
              {filtered.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => go(p.id)}
                    className="group w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/60 text-left"
                  >
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                      {ENERGY_LABEL[p.type]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{p.region}</div>
                    </div>
                    <div className="text-[11px] tabular-nums text-foreground shrink-0">
                      {p.capacityMW.toLocaleString(undefined, { maximumFractionDigits: 3 })} MW
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => openNew(e, p.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') openNew(e as any, p.id); }}
                      title="새창에서 열기"
                      className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center h-6 w-6 rounded hover:bg-background border shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-2 border-t bg-muted/30 text-[10px] text-muted-foreground text-center">
          총 {filtered.length}개 · 항목 호버 시 새창 열기 아이콘 표시
        </div>
      </PopoverContent>
    </Popover>
  );
}
