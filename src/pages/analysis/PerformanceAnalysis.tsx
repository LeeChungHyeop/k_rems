import { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Activity, Info, Gauge, Sun, Zap } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ReferenceLine, Cell, LineChart, Line, Legend } from 'recharts';
import { useScope } from '@/components/ScopeContext';
import { plantsForScope } from '@/components/ScopeFilter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ENERGY_LABEL, type Plant } from '@/data/mockData';
import {
  getCapabilities, getInverterOutputs, compareInverters, efficiencyOf, performanceRatio,
} from '@/lib/performance';

function hasAnyIssue(plant: Plant): boolean {
  const caps = getCapabilities(plant);
  const invs = getInverterOutputs(plant);
  if (compareInverters(invs).warnings.length > 0) return true;
  if (caps.hasDcCombiner && efficiencyOf(invs).warnings.length > 0) return true;
  if (caps.hasWeatherSensor && performanceRatio(plant, invs).pr < 75) return true;
  return false;
}

export default function PerformanceAnalysis() {
  const { scope } = useScope();
  const plants = useMemo(() => plantsForScope(scope).filter(p => p.type === 'solar'), [scope]);
  const issueMap = useMemo(() => {
    const m = new Map<string, boolean>();
    plants.forEach(p => m.set(p.id, hasAnyIssue(p)));
    return m;
  }, [plants]);
  const [plantId, setPlantId] = useState<string>(plants[0]?.id ?? '');
  const plant = plants.find(p => p.id === plantId) ?? plants[0];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><Gauge className="h-5 w-5 text-primary" />성능분석</h1>
        <p className="text-xs text-muted-foreground mt-1">
          인버터 상호 비교 / 변환 효율 / 발전 성능 계수(PR) 진단 · 현재 구분 필터 적용 발전소 {plants.length}개
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">발전소</span>
        <Select value={plant?.id} onValueChange={setPlantId}>
          <SelectTrigger className="h-9 w-[320px]">
            <SelectValue placeholder="발전소 선택">
              {plant && (
                <span className={issueMap.get(plant.id) ? 'text-destructive font-semibold' : ''}>
                  {plant.name} · {plant.capacityMW}MW
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[60vh]">
            {plants.map(p => (
              <SelectItem key={p.id} value={p.id}>
                <span className={issueMap.get(p.id) ? 'text-destructive font-semibold' : ''}>
                  {p.name} · {p.capacityMW}MW
                  {issueMap.get(p.id) && ' ⚠'}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {plant && issueMap.get(plant.id) && (
          <span className="inline-flex items-center gap-1 text-xs text-destructive">
            <AlertTriangle className="h-3 w-3" />알고리즘 경고 발생
          </span>
        )}
      </div>

      {plant ? <PerfTabs plant={plant} /> : (
        <div className="panel p-6 text-sm text-muted-foreground">필터에 해당하는 태양광 발전소가 없습니다.</div>
      )}
    </div>
  );
}


function PerfTabs({ plant }: { plant: Plant }) {
  const caps = getCapabilities(plant);
  const invs = useMemo(() => getInverterOutputs(plant), [plant.id]);

  return (
    <Tabs defaultValue="compare" className="w-full">
      <TabsList className="grid w-full max-w-2xl grid-cols-3">
        <TabsTrigger value="compare">인버터 상호 비교</TabsTrigger>
        <TabTriggerDisabled value="efficiency" enabled={caps.hasDcCombiner} label="인버터 변환 효율" disabledReason="접속반 데이터가 없어 비활성화되었습니다" />
        <TabTriggerDisabled value="pr" enabled={caps.hasWeatherSensor} label="발전 성능 계수(PR)" disabledReason="기상 데이터가 없어 비활성화되었습니다" />
      </TabsList>

      <TabsContent value="compare" className="mt-4">
        <CompareTab plant={plant} invs={invs} />
      </TabsContent>
      <TabsContent value="efficiency" className="mt-4">
        {caps.hasDcCombiner ? <EfficiencyTab invs={invs} /> : null}
      </TabsContent>
      <TabsContent value="pr" className="mt-4">
        {caps.hasWeatherSensor ? <PrTab plant={plant} invs={invs} /> : null}
      </TabsContent>
    </Tabs>
  );
}

function TabTriggerDisabled({ value, enabled, label, disabledReason }: { value: string; enabled: boolean; label: string; disabledReason: string }) {
  if (enabled) return <TabsTrigger value={value}>{label}</TabsTrigger>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="contents">
          <TabsTrigger value={value} disabled className="opacity-50 cursor-not-allowed">{label}</TabsTrigger>
        </span>
      </TooltipTrigger>
      <TooltipContent>{disabledReason}</TooltipContent>
    </Tooltip>
  );
}

function AlgoIntro({ icon: Icon, title, desc }: { icon: typeof Info; title: string; desc: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 flex items-start gap-2 text-xs text-muted-foreground">
      <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div>
        <div className="font-semibold text-foreground">{title}</div>
        <div>{desc}</div>
      </div>
    </div>
  );
}

function CompareTab({ plant, invs }: { plant: Plant; invs: ReturnType<typeof getInverterOutputs> }) {
  const { avg, warnings } = compareInverters(invs);
  const data = invs.map(i => ({ name: i.name, ac: +i.ac.toFixed(1), low: i.ac < avg * 0.92 && i.ac > 0 }));
  return (
    <div className="space-y-3">
      <AlgoIntro icon={Activity} title="인버터 상호 비교 알고리즘"
        desc="동일 부지 내 인버터들의 실시간 AC 출력(kW)을 비교하여, 전체 평균 대비 8% 이상 낮은 인버터를 저성능 의심으로 경고합니다." />
      <div className="panel">
        <div className="panel-header"><h3 className="panel-title">출력 비교 — {plant.name} · {invs.length}대</h3>
          <StatusBadge ok={warnings.length === 0} okLabel="정상" warnLabel={`경고 ${warnings.length}건`} />
        </div>
        <div className="p-4">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="kW" />
                <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <ReferenceLine y={+avg.toFixed(1)} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: `평균 ${avg.toFixed(1)}kW`, fontSize: 10, fill: 'hsl(var(--primary))' }} />
                <Bar dataKey="ac" name="AC 출력(kW)">
                  {data.map((d, i) => <Cell key={i} fill={d.low ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {warnings.length > 0 && (
            <div className="mt-3 text-xs text-destructive flex flex-wrap gap-2">
              <AlertTriangle className="h-4 w-4" />
              저성능 의심: {warnings.map(w => w.name).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EfficiencyTab({ invs }: { invs: ReturnType<typeof getInverterOutputs> }) {
  const { items, avg, warnings } = efficiencyOf(invs);
  const data = items.map(i => ({ name: i.name, eff: +i.eff.toFixed(2) }));
  return (
    <div className="space-y-3">
      <AlgoIntro icon={Zap} title="인버터 변환 효율 알고리즘"
        desc="접속반 DC 입력 대비 인버터 AC 출력 비율(AC/DC × 100%)을 계산합니다. 94% 미만이면 노후·열화·MPPT 이상을 의심합니다." />
      <div className="panel">
        <div className="panel-header"><h3 className="panel-title">변환 효율 — 평균 {avg.toFixed(2)}%</h3>
          <StatusBadge ok={warnings.length === 0} okLabel="정상" warnLabel={`경고 ${warnings.length}건`} />
        </div>
        <div className="p-4">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[85, 100]} unit="%" />
                <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <ReferenceLine y={94} stroke="hsl(var(--warning))" strokeDasharray="4 4" label={{ value: '기준 94%', fontSize: 10, fill: 'hsl(var(--warning))' }} />
                <Bar dataKey="eff" name="변환효율(%)">
                  {data.map((d, i) => <Cell key={i} fill={d.eff < 94 ? 'hsl(var(--destructive))' : 'hsl(var(--success))'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrTab({ plant, invs }: { plant: Plant; invs: ReturnType<typeof getInverterOutputs> }) {
  const { irradiance, totalAcKW, expectedKW, pr } = performanceRatio(plant, invs);
  // 시간대별 PR 모의 데이터
  const history = Array.from({ length: 12 }, (_, i) => {
    const base = pr + (Math.sin(i / 2) * 5);
    return { t: `${7 + i}시`, pr: +Math.max(50, Math.min(100, base)).toFixed(1) };
  });
  return (
    <div className="space-y-3">
      <AlgoIntro icon={Sun} title="발전 성능 계수(PR) 알고리즘"
        desc="실측 AC 출력과 일사량(W/m²) 기반 기대출력을 비교한 비율로, 발전 시스템의 종합 성능을 의미합니다. 75% 미만이면 종합 성능 저하로 경고합니다." />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KPI label="일사량" value={`${irradiance.toFixed(0)} W/m²`} />
        <KPI label="실측 AC" value={`${totalAcKW.toFixed(1)} kW`} />
        <KPI label="기대 출력" value={`${expectedKW.toFixed(1)} kW`} />
        <KPI label="PR" value={`${pr.toFixed(1)} %`} highlight={pr < 75 ? 'bad' : 'good'} />
      </div>
      <div className="panel">
        <div className="panel-header"><h3 className="panel-title">PR 시간대 추이</h3>
          <StatusBadge ok={pr >= 75} okLabel="정상" warnLabel="경고" />
        </div>
        <div className="p-4 h-64">
          <ResponsiveContainer>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="t" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[50, 100]} unit="%" />
              <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <ReferenceLine y={75} stroke="hsl(var(--warning))" strokeDasharray="4 4" label={{ value: '기준 75%', fontSize: 10, fill: 'hsl(var(--warning))' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="pr" stroke="hsl(var(--primary))" strokeWidth={2} name="PR(%)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ ok, okLabel, warnLabel }: { ok: boolean; okLabel: string; warnLabel: string }) {
  return ok ? (
    <Badge variant="secondary" className="bg-success/15 text-success border-success/30"><CheckCircle2 className="h-3 w-3 mr-1" />{okLabel}</Badge>
  ) : (
    <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />{warnLabel}</Badge>
  );
}

function KPI({ label, value, highlight }: { label: string; value: string; highlight?: 'good' | 'bad' }) {
  const cls = highlight === 'bad' ? 'text-destructive' : highlight === 'good' ? 'text-success' : 'text-foreground';
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}
