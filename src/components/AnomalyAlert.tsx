import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface AnomalyItem {
  plantName: string;
  metric: string;          // e.g. "매출", "비용", "순이익"
  current: number;
  avg3: number;
  ratio: number;           // (current - avg3) / avg3
}

interface Props {
  items: AnomalyItem[];
  /** dismissal key — when "다시 보지 않음" is clicked, this key is stored */
  dismissKey: string;
  fmt?: (n: number) => string;
}

function fmtKRW(n: number) {
  if (Math.abs(n) >= 1_000_000_000) return `₩${(n / 100_000_000).toFixed(2)}억`;
  if (Math.abs(n) >= 10_000_000) return `₩${(n / 10_000).toFixed(0)}만`;
  return `₩${n.toLocaleString('ko-KR')}`;
}

const PREFIX = 'k-rems-anomaly-dismissed:';

export function AnomalyAlert({ items, dismissKey, fmt = fmtKRW }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    try {
      if (localStorage.getItem(PREFIX + dismissKey) === '1') return;
    } catch {}
    setOpen(true);
  }, [items.length, dismissKey]);

  if (items.length === 0) return null;

  const dismissForever = () => {
    try { localStorage.setItem(PREFIX + dismissKey, '1'); } catch {}
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            이상 감지 — 이전 3개월 평균 대비 50% 초과
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 mt-2 max-h-[400px] overflow-auto">
              <div className="text-xs text-muted-foreground">
                {items.length}건의 이상 항목이 감지되었습니다.
              </div>
              <div className="border rounded-md divide-y">
                {items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 text-xs">
                    <span className="font-semibold text-foreground min-w-[140px] truncate">{it.plantName}</span>
                    <span className="text-muted-foreground min-w-[48px]">{it.metric}</span>
                    <span className="tabular-nums font-semibold text-destructive">{fmt(it.current)}</span>
                    <span className="text-muted-foreground tabular-nums">
                      (평균 {fmt(it.avg3)})
                    </span>
                    <span className="ml-auto px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-bold tabular-nums">
                      +{(it.ratio * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={dismissForever}>다시 보지 않음</AlertDialogCancel>
          <AlertDialogAction onClick={() => setOpen(false)}>닫기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
