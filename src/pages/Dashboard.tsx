import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, Legend, Cell,
  PieChart, Pie,
} from 'recharts';
import {
  Zap, Activity, Wallet, Gauge, Building2, AlertTriangle, AlertCircle, Info, Wifi, WifiOff, X, Users, ArrowLeft, CalendarCheck,
} from 'lucide-react';
import {
  PLANTS, ENERGY_LABEL, ENERGY_COLOR_VAR, ALARMS, PRICE, PLANT_GROUPS, OPERATORS, INSPECTION_SCHEDULES,
  getMonthlyEnergyByType, getThisMonthDailyByType, getCurrentOutput, getPlantDailyEnergy, getYesterdayByPlant,
  getPlantEquipmentSummary, getPlantCommSummary, EQUIPMENT_LABEL, getCurrentOutputByType,
} from '@/data/mockData';

import { KoreaMap } from '@/components/KoreaMap';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useScope } from '@/components/ScopeContext';
import { plantsForScope } from '@/components/ScopeFilter';

const ENERGY_KEYS = ['solar', 'wind', 'hydro', 'fuelcell', 'ess'] as const;

function fmtNum(n: number, digits = 0) { return n.toLocaleString('ko-KR', { maximumFractionDigits: digits }); }

function Panel({ title, action, children, className = '' }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`panel flex flex-col min-h-0 ${className}`}>
      <header className="panel-header">
        <h3 className="panel-title">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          {title}
        </h3>
        {action}
      </header>
      <div className="panel-body flex-1 min-h-0 overflow-hidden">{children}</div>
    </section>
  );
}

type Mode = 'overview' | 'group-list' | 'operator-list' | 'group-detail' | 'operator-detail';

export default function Dashboard() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const groupIdParam = params.groupId || searchParams.get('group');
  const operatorIdParam = params.operatorId || searchParams.get('operator');
  const plantId = searchParams.get('plant');
  const { scope } = useScope();

  const mode: Mode = groupIdParam ? 'group-detail'
    : operatorIdParam ? 'operator-detail'
    : 'overview';

  const filteredPlants = useMemo(() => {
    // URL 파라미터 (그룹/담당자/특정 발전소 상세) 우선
    if (plantId) return PLANTS.filter(p => p.id === plantId);
    if (groupIdParam) {
      const g = PLANT_GROUPS.find(x => x.id === groupIdParam);
      if (g) return PLANTS.filter(p => g.plantIds.includes(p.id));
    }
    if (operatorIdParam) return PLANTS.filter(p => p.operatorId === operatorIdParam);
    // 그 외에는 헤더의 전역 구분 필터 적용
    return plantsForScope(scope);
  }, [groupIdParam, operatorIdParam, plantId, scope]);

  const filterLabel = useMemo(() => {
    if (plantId) return PLANTS.find(p => p.id === plantId)?.name;
    if (groupIdParam) return PLANT_GROUPS.find(g => g.id === groupIdParam)?.name + ' 그룹';
    if (operatorIdParam) {
      const o = OPERATORS.find(x => x.id === operatorIdParam);
      return o ? `${o.name} 담당자` : null;
    }
    if (scope.ids.length > 0) {
      const k = scope.kind === 'plant' ? '발전소' : scope.kind === 'group' ? '그룹' : '담당자';
      return `${k} ${scope.ids.length}건 선택`;
    }
    return null;
  }, [groupIdParam, operatorIdParam, plantId, scope]);



  const monthly = useMemo(() => getMonthlyEnergyByType(), []);
  const thisMonth = useMemo(() => getThisMonthDailyByType(), []);
  const yesterday = useMemo(() => getYesterdayByPlant().filter(y => filteredPlants.some(p => p.id === y.plantId)), [filteredPlants]);

  const totals = useMemo(() => {
    const totalCapacity = filteredPlants.reduce((s, p) => s + p.capacityMW, 0);
    const currentOutput = filteredPlants.reduce((s, p) => s + getCurrentOutput(p), 0);
    const todayEnergy = filteredPlants.reduce((s, p) => s + getPlantDailyEnergy(p), 0);
    const revenue = todayEnergy * 1000 * (PRICE.SMP + PRICE.REC);
    const utilization = totalCapacity > 0 ? (currentOutput / totalCapacity) * 100 : 0;
    return { totalCapacity, currentOutput, todayEnergy, revenue, utilization, plantCount: filteredPlants.length };
  }, [filteredPlants]);

  const todayByPlantSorted = useMemo(
    () => [...filteredPlants].map(p => ({ p, today: getPlantDailyEnergy(p), current: getCurrentOutput(p) }))
      .sort((a, b) => b.today - a.today),
    [filteredPlants]
  );

  // 정기검사 일정 (그룹/담당자 detail에서만 노출)
  const inspections = useMemo(() => {
    if (mode !== 'group-detail' && mode !== 'operator-detail') return [];
    const pids = new Set(filteredPlants.map(p => p.id));
    return INSPECTION_SCHEDULES.filter(s => pids.has(s.plantId)).slice(0, 10);
  }, [mode, filteredPlants]);

  return (
    <div className="p-4 lg:p-5 h-full">
      <div className="mb-3 flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2 flex-wrap">
            {(mode === 'group-detail' || mode === 'operator-detail') && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => navigate('/')}>
                <ArrowLeft className="h-3 w-3" /> 통합 대시보드
              </Button>
            )}
            {filterLabel ? `${filterLabel} 대시보드` : '통합 대시보드'}
            {filterLabel && plantId && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setSearchParams({})}>
                <X className="h-3 w-3" /> 필터 초기화
              </Button>
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filterLabel ? `${filteredPlants.length}개 발전소 · 그룹/담당자 단위 모니터링` : '전국 신재생 발전소 통합 모니터링 · 실시간 현황'}
          </p>
        </div>
        
        <div className="text-xs text-muted-foreground tabular-nums">
          데이터 갱신: {new Date().toLocaleTimeString('ko-KR')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 auto-rows-[minmax(220px,auto)]">
        <Panel title="올해 월별 발전량">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 5, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}GWh`} />
              <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }}
                formatter={(v: number, n) => [`${fmtNum(v)} MWh`, ENERGY_LABEL[n as keyof typeof ENERGY_LABEL]]} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => ENERGY_LABEL[v as keyof typeof ENERGY_LABEL]} />
              {ENERGY_KEYS.map((k) => <Bar key={k} dataKey={k} stackId="a" fill={ENERGY_COLOR_VAR[k]} />)}
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="실시간 현황">
          <RealtimePanel plants={filteredPlants} totals={totals} />
        </Panel>

        <Panel title="알람 현황" action={<span className="text-[10px] text-muted-foreground">총 {ALARMS.length}건</span>}>
          <div className="space-y-1.5 overflow-y-auto h-full max-h-[200px] pr-1">
            {ALARMS.map((a) => (
              <div key={a.id} className="flex items-start gap-2 p-2 rounded-md border bg-card hover:bg-muted/40 transition-colors">
                <AlarmIcon level={a.level} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-muted-foreground tabular-nums">{a.time}</span>
                    <span className="font-semibold text-foreground truncate">{a.plantName}</span>
                  </div>
                  <div className="text-xs text-foreground/80 mt-0.5">{a.message}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="이번달 일별 발전량">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={thisMonth} margin={{ top: 5, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={2} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${fmtNum(v)}`} />
              <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }}
                formatter={(v: number, n) => [`${fmtNum(v)} MWh`, ENERGY_LABEL[n as keyof typeof ENERGY_LABEL]]} />
              {ENERGY_KEYS.map((k) => <Bar key={k} dataKey={k} stackId="a" fill={ENERGY_COLOR_VAR[k]} />)}
            </BarChart>
          </ResponsiveContainer>
        </Panel>


        <Panel title="전국 발전소 위치 지도" className="lg:row-span-2">
          <KoreaMap height={520} />
        </Panel>

        <Panel title={`${filterLabel ?? '전체'} 발전소 목록`} className="lg:row-span-2"
          action={<span className="text-[10px] text-muted-foreground">{filteredPlants.length}개소</span>}>
          <div className="overflow-auto h-full max-h-[520px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card border-b">
                <tr className="text-muted-foreground">
                  <th className="text-left py-2 px-2 font-medium">통신</th>
                  <th className="text-left py-2 px-2 font-medium">설비</th>
                  <th className="text-left py-2 px-2 font-medium">사업소명</th>
                  <th className="text-right py-2 px-2 font-medium">설비(MW)</th>
                  <th className="text-right py-2 px-2 font-medium">금일(MWh)</th>
                </tr>
              </thead>
              <tbody>
                {todayByPlantSorted.map(({ p, today }) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40 cursor-pointer"
                      onClick={() => navigate(`/plant/${p.id}`)}>
                    <td className="py-1.5 px-2"><CommBadge plantId={p.id} /></td>
                    <td className="py-1.5 px-2"><EquipBadge plantId={p.id} /></td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: ENERGY_COLOR_VAR[p.type] }} />
                        <span className="font-medium text-foreground truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{fmtNum(p.capacityMW, 1)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums font-semibold">{fmtNum(today, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="전일 발전량 (발전소별)"
          action={<span className="text-[10px] text-muted-foreground">{yesterday.length}개소 · 스크롤하여 보기</span>}>
          <YesterdayScrollChart data={yesterday} />
        </Panel>
      </div>

      {/* 정기검사 일정 (그룹/담당자 detail) */}
      {(mode === 'group-detail' || mode === 'operator-detail') && (
        <section className="panel mt-4">
          <header className="panel-header">
            <h3 className="panel-title flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-primary" /> 다가오는 정기검사 일정</h3>
            <span className="text-[10px] text-muted-foreground">{inspections.length}건</span>
          </header>
          <div className="overflow-auto max-h-[300px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="px-3 py-2">검사일</th>
                  <th className="px-3 py-2">발전소</th>
                  <th className="px-3 py-2">구분</th>
                  <th className="px-3 py-2">담당자</th>
                  <th className="px-3 py-2">검사기관</th>
                </tr>
              </thead>
              <tbody>
                {inspections.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted-foreground py-6">예정된 정기검사가 없습니다.</td></tr>
                )}
                {inspections.map(s => (
                  <tr key={s.id} className="border-b">
                    <td className="px-3 py-2 tabular-nums font-medium">{s.scheduledDate}</td>
                    <td className="px-3 py-2">{s.plantName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{s.category}</td>
                    <td className="px-3 py-2">{s.inspector}</td>
                    <td className="px-3 py-2 text-muted-foreground">{s.institution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function ScopeHeader({ scope, setScope }: { scope: 'none'|'group'|'operator'; setScope: (v: any) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">구분</span>
      <Select value={scope} onValueChange={(v) => setScope(v)}>
        <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="구분" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">통합 (전체)</SelectItem>
          <SelectItem value="group">그룹별</SelectItem>
          <SelectItem value="operator">담당자별</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function CardGrid({ title, items }: { title: string; items: { id: string; name: string; sub?: string; stats: { count: number; cap: number }; onClick: () => void; icon: React.ReactNode }[] }) {
  return (
    <section className="mb-6">
      <h2 className="text-sm font-bold mb-3">{title} <span className="text-xs text-muted-foreground font-normal">({items.length}개)</span></h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(it => (
          <button key={it.id} onClick={it.onClick}
            className="panel text-left hover:border-primary hover:shadow-[var(--shadow-elevated)] transition-all p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">{it.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{it.name}</div>
                {it.sub && <div className="text-[10px] text-muted-foreground truncate">{it.sub}</div>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-muted/50 px-2 py-1.5">
                <div className="text-[9px] text-muted-foreground">발전소</div>
                <div className="font-bold tabular-nums">{it.stats.count}</div>
              </div>
              <div className="rounded-md bg-muted/50 px-2 py-1.5">
                <div className="text-[9px] text-muted-foreground">설비(MW)</div>
                <div className="font-bold tabular-nums">{it.stats.cap.toFixed(1)}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: 'primary' | 'accent' | 'success' | 'secondary' | 'muted' }) {
  const accentMap = {
    primary: 'bg-primary/10 text-primary', accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success', secondary: 'bg-secondary/10 text-secondary',
    muted: 'bg-muted text-muted-foreground',
  };
  return (
    <div className="rounded-md border bg-card p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-7 w-7 rounded-md items-center justify-center ${accentMap[accent]}`}>{icon}</span>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="text-lg font-bold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

function RealtimePanel({ plants, totals }: { plants: typeof PLANTS; totals: { totalCapacity: number; currentOutput: number; todayEnergy: number; revenue: number; utilization: number; plantCount: number } }) {
  const byType = useMemo(() => getCurrentOutputByType(plants).filter(d => d.output > 0 || d.capacity > 0), [plants]);
  const data = byType.length > 0 ? byType : [{ type: 'solar' as const, output: 0, capacity: 1 }];
  return (
    <div className="h-full flex gap-3 items-stretch">
      {/* Left: semicircle donut by energy type */}
      <div className="flex-shrink-0 w-[160px] flex flex-col items-center justify-between py-1">
        <div className="relative w-full flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="output"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={1}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((d, i) => <Cell key={i} fill={ENERGY_COLOR_VAR[d.type]} />)}
              </Pie>
              <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                formatter={(v: number, n) => [`${fmtNum(v, 2)} MW`, ENERGY_LABEL[n as keyof typeof ENERGY_LABEL]]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className="text-[10px] text-muted-foreground">현재 출력</div>
            <div className="text-sm font-bold text-primary tabular-nums leading-tight">{fmtNum(totals.currentOutput, 2)} MW</div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 mt-1.5">
          {byType.map(d => (
            <span key={d.type} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: ENERGY_COLOR_VAR[d.type] }} />
              {ENERGY_LABEL[d.type]}
            </span>
          ))}
        </div>
      </div>
      {/* Right: KPI grid — stretches to match donut height */}
      <div className="flex-1 min-w-0 grid grid-cols-2 grid-rows-3 gap-1.5">
        <MiniStat label="금일 누적 발전량" value={`${fmtNum(totals.todayEnergy, 1)} MWh`} accent="primary" />
        <MiniStat label="금일 누적 수익" value={`₩${fmtNum(totals.revenue / 1_000_000, 1)}M`} accent="success" />
        <MiniStat label="현재 이용률" value={`${totals.utilization.toFixed(1)}%`} accent="secondary" />
        <MiniStat label="총 설비용량" value={`${fmtNum(totals.totalCapacity, 1)} MW`} accent="muted" />
        <MiniStat label="총 사업소" value={`${totals.plantCount} 개소`} accent="muted" />
        <MiniStat label="SMP+REC" value={`₩${(PRICE.SMP + PRICE.REC).toFixed(1)}/kWh`} accent="muted" />
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent: 'primary' | 'success' | 'secondary' | 'muted' }) {
  const dot = {
    primary: 'bg-primary', success: 'bg-success', secondary: 'bg-secondary', muted: 'bg-muted-foreground/40',
  }[accent];
  return (
    <div className="rounded-md border bg-card px-2 py-1.5 flex flex-col justify-center min-h-0">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className={`h-1 w-1 rounded-full ${dot}`} /> {label}
      </div>
      <div className="text-[13px] font-bold tabular-nums text-foreground leading-tight mt-0.5">{value}</div>
    </div>
  );
}

function AlarmIcon({ level }: { level: 'critical' | 'warning' | 'info' }) {
  if (level === 'critical') return <span className="inline-flex h-6 w-6 rounded-md items-center justify-center bg-destructive/15 text-destructive shrink-0"><AlertCircle className="h-3.5 w-3.5" /></span>;
  if (level === 'warning') return <span className="inline-flex h-6 w-6 rounded-md items-center justify-center bg-warning/15 text-warning shrink-0"><AlertTriangle className="h-3.5 w-3.5" /></span>;
  return <span className="inline-flex h-6 w-6 rounded-md items-center justify-center bg-secondary/15 text-secondary shrink-0"><Info className="h-3.5 w-3.5" /></span>;
}

function CommBadge({ plantId }: { plantId: string }) {
  const { status, detail } = getPlantCommSummary(plantId);
  const body =
    status === 'down' ? <span className="inline-flex items-center gap-1 text-destructive text-[10px]"><WifiOff className="h-3 w-3" />단절</span>
    : status === 'delay' ? <span className="inline-flex items-center gap-1 text-warning text-[10px]"><Wifi className="h-3 w-3" />지연</span>
    : <span className="inline-flex items-center gap-1 text-success text-[10px]"><Wifi className="h-3 w-3" />정상</span>;
  return (
    <Tooltip>
      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}><span>{body}</span></TooltipTrigger>
      <TooltipContent side="right" className="max-w-[260px] text-xs">{detail}</TooltipContent>
    </Tooltip>
  );
}

function EquipBadge({ plantId }: { plantId: string }) {
  const { ok, faults } = getPlantEquipmentSummary(plantId);
  const body = ok
    ? <span className="inline-flex items-center gap-1 text-success text-[10px]"><Activity className="h-3 w-3" />정상</span>
    : <span className="inline-flex items-center gap-1 text-destructive text-[10px] font-semibold"><AlertCircle className="h-3 w-3" />이상 {faults.length}</span>;
  return (
    <Tooltip>
      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}><span>{body}</span></TooltipTrigger>
      <TooltipContent side="right" className="max-w-[280px] text-xs">
        {ok ? (
          <div>모든 설비 정상 (인버터/차단기/접속반)</div>
        ) : (
          <div className="space-y-1">
            <div className="font-semibold text-destructive">이상 설비 {faults.length}건</div>
            {faults.map((f, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-muted-foreground">[{EQUIPMENT_LABEL[f.kind]}]</span>
                <span className="font-medium">{f.name}</span>
                {f.note && <span className="text-muted-foreground">— {f.note}</span>}
              </div>
            ))}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function YesterdayScrollChart({
  data,
}: {
  data: { plantId: string; plantName: string; type: keyof typeof ENERGY_COLOR_VAR; energyMWh: number }[];
}) {
  const ROW_H = 28;
  const CONTAINER_H = 260;
  const LABEL_W = 130;
  const VALUE_W = 64;
  const AXIS_H = 22;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // 현재 화면에 보이는 행 범위 계산
  const visibleCount = Math.ceil(CONTAINER_H / ROW_H);
  const startIdx = Math.floor(scrollTop / ROW_H);
  const endIdx = Math.min(data.length, startIdx + visibleCount);
  const visible = data.slice(startIdx, endIdx);
  const rawMax = Math.max(1, ...visible.map((d) => d.energyMWh));

  // 보기 좋은 눈금 단위로 라운드 (nice number)
  const niceMax = (m: number) => {
    const exp = Math.pow(10, Math.floor(Math.log10(m)));
    const f = m / exp;
    const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return nice * exp;
  };
  const axisMax = niceMax(rawMax * 1.05);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => +(axisMax * t).toFixed(axisMax < 5 ? 1 : 0));
  const fmtTick = (v: number) => v.toLocaleString('ko-KR', { maximumFractionDigits: axisMax < 5 ? 1 : 0 });

  return (
    <div className="relative" style={{ height: CONTAINER_H + AXIS_H }}>
      {/* 스크롤 영역 (행 목록) */}
      <div
        ref={scrollRef}
        className="overflow-y-auto pr-1"
        style={{ height: CONTAINER_H }}
      >
        {data.map((d) => (
          <div key={d.plantId} className="flex items-center" style={{ height: ROW_H }}>
            <div
              className="text-[11px] text-muted-foreground truncate pr-2"
              style={{ width: LABEL_W }}
              title={d.plantName}
            >
              {d.plantName}
            </div>
            <div className="flex-1 relative h-full flex items-center">
              {/* 그리드 라인 */}
              {ticks.map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-dashed border-border/60"
                  style={{ left: `${(i / (ticks.length - 1)) * 100}%` }}
                />
              ))}
              {/* 바 */}
              <div
                className="h-4 rounded-sm transition-all"
                style={{
                  width: `${Math.min(100, (d.energyMWh / axisMax) * 100)}%`,
                  background: ENERGY_COLOR_VAR[d.type],
                }}
                title={`${d.energyMWh.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} MWh`}
              />
            </div>
            <div
              className="text-[11px] tabular-nums text-foreground text-right pl-2"
              style={{ width: VALUE_W }}
            >
              {d.energyMWh.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}
            </div>
          </div>
        ))}
      </div>

      {/* 고정 X축 (적응형) */}
      <div
        className="absolute left-0 right-0 border-t border-border bg-card"
        style={{ bottom: 0, height: AXIS_H }}
      >
        <div className="flex items-center h-full">
          <div style={{ width: LABEL_W }} className="text-[10px] text-muted-foreground pr-2 text-right">
            (MWh)
          </div>
          <div className="flex-1 relative h-full">
            {ticks.map((t, i) => (
              <div
                key={i}
                className="absolute top-0 text-[10px] text-muted-foreground tabular-nums"
                style={{
                  left: `${(i / (ticks.length - 1)) * 100}%`,
                  transform:
                    i === 0 ? 'translateX(0)' :
                    i === ticks.length - 1 ? 'translateX(-100%)' :
                    'translateX(-50%)',
                }}
              >
                {fmtTick(t)}
              </div>
            ))}
          </div>
          <div style={{ width: VALUE_W }} />
        </div>
      </div>
    </div>
  );
}

