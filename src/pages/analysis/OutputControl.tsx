import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gauge, AlertTriangle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getControlledPlants, ENERGY_LABEL } from '@/data/mockData';

export default function OutputControl() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick(v => v + 1), 3000);
    return () => window.clearInterval(t);
  }, []);
  const rows = getControlledPlants();

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <header className="flex items-center gap-2">
        <Gauge className="h-5 w-5 text-secondary" />
        <h1 className="text-xl font-bold">출력제어 현황</h1>
        <span className="text-xs text-muted-foreground ml-2">RTU를 통해 인버터가 제어 중인 발전소 목록</span>
      </header>

      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">제어중 발전소 ({rows.length}개소)</h3>
          <span className="text-[11px] text-muted-foreground">발전소 상세에서 인버터별 ON/OFF/타겟제어 가능</span>
        </div>
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-60" />
            현재 출력제어 중인 발전소가 없습니다. (모든 인버터 정상 ON)
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2">발전소</th>
                  <th className="text-left px-3 py-2">에너지원</th>
                  <th className="text-left px-3 py-2">지역</th>
                  <th className="text-right px-3 py-2">인버터</th>
                  <th className="text-right px-3 py-2">ON</th>
                  <th className="text-right px-3 py-2">OFF</th>
                  <th className="text-right px-3 py-2">타겟제어</th>
                  <th className="text-right px-3 py-2">평균 타겟</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.plant.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{r.plant.name}</td>
                    <td className="px-3 py-2">{ENERGY_LABEL[r.plant.type]}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{r.plant.region}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.total}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.on}</td>
                    <td className="px-3 py-2 text-right">
                      {r.off > 0 ? <Badge variant="destructive">{r.off}</Badge> : <span className="text-muted-foreground">0</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.targeted > 0 ? <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">{r.targeted}</Badge> : <span className="text-muted-foreground">0</span>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.targeted > 0 ? `${r.avgTargetPct}%` : '-'}</td>
                    <td className="px-3 py-2 text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/plant/${r.plant.id}`}><ExternalLink className="h-3 w-3 mr-1" />상세</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">※ 데모: 발전소 상세 페이지에서 인버터 OFF 또는 타겟제어 시 이 목록에 표시됩니다. (tick: {tick})</p>
    </div>
  );
}
