import { useState } from 'react';
import { Power, PowerOff, Gauge, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getInvertersForPlant, setInverterState, type InverterMode, type InverterState } from '@/data/mockData';

export function PlantControlPanel({ plantId }: { plantId: string }) {
  const [, setTick] = useState(0);
  const [progressFor, setProgressFor] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [targetDlg, setTargetDlg] = useState<{ name: string; pct: number } | null>(null);
  const list = getInvertersForPlant(plantId);

  const runWithProgress = (name: string, action: () => void, label: string) => {
    setProgressFor(name);
    setProgress(0);
    const t = window.setInterval(() => {
      setProgress(p => {
        const next = p + 10 + Math.random() * 15;
        if (next >= 100) {
          window.clearInterval(t);
          action();
          setTimeout(() => {
            setProgressFor(null);
            setProgress(0);
            setTick(v => v + 1);
            toast.success(`${name} 제어 완료`, { description: label });
          }, 200);
          return 100;
        }
        return next;
      });
    }, 120);
  };

  const handleMode = (inv: InverterState, mode: InverterMode) => {
    if (mode === 'target') {
      if (!inv.targetSupported) return;
      setTargetDlg({ name: inv.name, pct: inv.mode === 'target' ? inv.targetPct : 80 });
      return;
    }
    runWithProgress(inv.name, () => {
      setInverterState(plantId, inv.name, { mode, targetPct: mode === 'on' ? 100 : 0 });
    }, mode === 'on' ? 'ON (정상 운전)' : 'OFF (정지)');
  };

  const confirmTarget = () => {
    if (!targetDlg) return;
    const { name, pct } = targetDlg;
    setTargetDlg(null);
    runWithProgress(name, () => {
      setInverterState(plantId, name, { mode: 'target', targetPct: pct });
    }, `타겟제어 ${pct}%`);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title"><Gauge className="h-4 w-4 text-secondary" />발전소 출력제어 (RTU)</h3>
        <span className="text-[11px] text-muted-foreground">인버터별 ON / OFF / 타겟제어</span>
      </div>
      <div className="p-4 space-y-2">
        {list.length === 0 && <div className="text-sm text-muted-foreground">제어 가능한 인버터가 없습니다.</div>}
        {list.map(inv => {
          const isProg = progressFor === inv.name;
          return (
            <div key={inv.name} className="rounded-md border bg-card p-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{inv.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    정격 {inv.capacityKW.toFixed(1)} kW · 타겟제어 {inv.targetSupported ? '지원' : '미지원'}
                  </div>
                </div>
                <StateBadge inv={inv} />
              </div>

              {isProg ? (
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Loader2 className="h-3 w-3 animate-spin" />RTU 제어 명령 전송 중… {Math.round(progress)}%
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ) : (
                <div className="mt-3 inline-flex rounded-md border p-0.5 bg-background">
                  <ToggleBtn active={inv.mode === 'on'} onClick={() => handleMode(inv, 'on')} icon={<Power className="h-3 w-3" />}>ON</ToggleBtn>
                  <ToggleBtn active={inv.mode === 'off'} onClick={() => handleMode(inv, 'off')} icon={<PowerOff className="h-3 w-3" />}>OFF</ToggleBtn>
                  <ToggleBtn
                    active={inv.mode === 'target'}
                    disabled={!inv.targetSupported}
                    onClick={() => handleMode(inv, 'target')}
                    icon={<Gauge className="h-3 w-3" />}
                  >
                    타겟제어{inv.mode === 'target' ? ` ${inv.targetPct}%` : ''}
                  </ToggleBtn>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!targetDlg} onOpenChange={(o) => !o && setTargetDlg(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{targetDlg?.name} 타겟제어</DialogTitle>
          </DialogHeader>
          {targetDlg && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div className="text-3xl font-bold tabular-nums">{targetDlg.pct}%</div>
                <div className="text-[11px] text-muted-foreground mt-1">정격 출력 대비 목표 비율</div>
              </div>
              <Slider
                value={[targetDlg.pct]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setTargetDlg(d => d ? { ...d, pct: v[0] } : null)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTargetDlg(null)}>취소</Button>
            <Button onClick={confirmTarget}>제어 전송</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToggleBtn({ active, disabled, onClick, icon, children }: { active: boolean; disabled?: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded transition-colors ${
        active ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {icon}{children}
    </button>
  );
}

function StateBadge({ inv }: { inv: InverterState }) {
  if (inv.mode === 'off') return <Badge variant="destructive">OFF</Badge>;
  if (inv.mode === 'target') return <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">타겟 {inv.targetPct}%</Badge>;
  return <Badge className="bg-success text-success-foreground hover:bg-success/90">ON</Badge>;
}
