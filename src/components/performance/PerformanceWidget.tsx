import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Gauge, ExternalLink } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ReferenceLine, Cell } from 'recharts';
import type { Plant } from '@/data/mockData';
import { getCapabilities, getInverterOutputs, compareInverters, efficiencyOf, performanceRatio } from '@/lib/performance';

export function PerformanceWidget({ plant }: { plant: Plant }) {
  const caps = getCapabilities(plant);
  const invs = getInverterOutputs(plant);
  const cmp = compareInverters(invs);
  const eff = caps.hasDcCombiner ? efficiencyOf(invs) : null;
  const pr = caps.hasWeatherSensor ? performanceRatio(plant, invs) : null;

  const cmpData = invs.map(i => ({ name: i.name, ac: +i.ac.toFixed(1), low: i.ac < cmp.avg * 0.92 && i.ac > 0 }));

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title"><Gauge className="h-4 w-4 text-primary" />알고리즘 적용 상태</h3>
        <Link to="/analysis/performance" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          성능분석 열기 <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <AlgoStatus name="인버터 상호 비교" available okState={cmp.warnings.length === 0}
            detail={cmp.warnings.length === 0 ? '정상' : `${cmp.warnings.length}대 저성능 의심`} />
          <AlgoStatus name="변환 효율" available={caps.hasDcCombiner}
            okState={eff ? eff.warnings.length === 0 : true}
            detail={eff ? `평균 ${eff.avg.toFixed(1)}%` : '접속반 데이터 없음'} />
          <AlgoStatus name="PR(성능계수)" available={caps.hasWeatherSensor}
            okState={pr ? pr.pr >= 75 : true}
            detail={pr ? `PR ${pr.pr.toFixed(1)}%` : '기상센서 없음'} />
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">인버터 출력 분포</div>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={cmpData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="kW" />
                <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <ReferenceLine y={+cmp.avg.toFixed(1)} stroke="hsl(var(--primary))" strokeDasharray="4 4" />
                <Bar dataKey="ac" name="AC(kW)">
                  {cmpData.map((d, i) => <Cell key={i} fill={d.low ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlgoStatus({ name, available, okState, detail }: { name: string; available: boolean; okState: boolean; detail: string }) {
  return (
    <div className="rounded-md border bg-card p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">{name}</span>
        {available ? (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 text-[10px]">적용 가능</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-[10px]">적용 불가</Badge>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs">
        {!available ? (
          <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
        ) : okState ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
        )}
        <span className={!available ? 'text-muted-foreground' : okState ? 'text-success' : 'text-destructive'}>{detail}</span>
      </div>
    </div>
  );
}
